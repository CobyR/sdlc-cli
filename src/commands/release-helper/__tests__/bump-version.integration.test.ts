import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {createTempDir, cleanupTempDir, createTestFile, readTestFile} from '../../../__tests__/helpers/test-utils'
import {testPackageJson, testSDLCConfig} from '../../../__tests__/helpers/fixtures'
import BumpVersion from '../bump-version'
import * as branchLib from '../../../lib/git/branch'
import * as versionLib from '../../../lib/version'
import * as trackerLib from '../../../lib/issue-tracker'
import * as configLib from '../../../lib/config'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

// Mock dependencies
vi.mock('../../../lib/git/branch')
vi.mock('../../../lib/version')
vi.mock('../../../lib/issue-tracker')
vi.mock('../../../lib/config')
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

describe('BumpVersion Command - Integration Tests', () => {
  let tempDir: string
  let command: BumpVersion

  beforeEach(async () => {
    tempDir = await createTempDir()
    command = new BumpVersion([], {} as any)
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
    vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(true)
    vi.mocked(configLib.getConfig).mockResolvedValue(testSDLCConfig)
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTempDir(tempDir)
    }
  })

  describe('full bump-version workflow', () => {
    it('should complete full version bump workflow for Node.js', async () => {
      // Setup test files
      await createTestFile(tempDir, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(tempDir, 'CHANGELOG.md', '# Changelog\n\n')

      // Mock version manager
      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.0'),
        updateVersion: vi.fn().mockResolvedValue(undefined),
        getVersionFiles: vi.fn().mockReturnValue(['package.json', 'CHANGELOG.md']),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      // Mock issue tracker
      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue([
          {id: '1', title: 'Fix bug', url: 'https://github.com/test/repo/issues/1'},
        ]),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      // Mock git commands
      vi.mocked(exec).mockImplementation((cmd: string, options: any, callback?: any) => {
        const cb = callback || options
        if (cmd.includes('git add')) {
          cb(null, '', '')
        } else if (cmd.includes('git commit')) {
          cb(null, '', '')
        } else if (cmd.includes('git branch --show-current')) {
          cb(null, 'feature/release\n', '')
        } else if (cmd.includes('git push')) {
          cb(null, '', '')
        } else {
          cb(null, '', '')
        }
        return {} as any
      })

      // Mock parse to return flags
      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {
          message: 'Test release',
          'no-commit': false,
        },
        args: {},
      } as any)

      const logSpy = vi.spyOn(command, 'log')

      await command.run()

      expect(mockVersionManager.getCurrentVersion).toHaveBeenCalled()
      expect(mockTracker.getFixedIssues).toHaveBeenCalled()
      expect(mockVersionManager.updateVersion).toHaveBeenCalledWith(
        '1.0.1',
        expect.any(String),
        expect.arrayContaining([expect.stringContaining('[1]')]),
        'Test release'
      )
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Previous Version: 1.0.0'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Next Version: 1.0.1'))
    })

    it('should skip commit when --no-commit flag is used', async () => {
      await createTestFile(tempDir, 'package.json', JSON.stringify(testPackageJson, null, 2))

      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.0'),
        updateVersion: vi.fn().mockResolvedValue(undefined),
        getVersionFiles: vi.fn().mockReturnValue(['package.json', 'CHANGELOG.md']),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {
          message: 'Test release',
          'no-commit': true,
        },
        args: {},
      } as any)

      const logSpy = vi.spyOn(command, 'log')
      const execSpy = vi.mocked(exec)

      await command.run()

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping automatic commit'))
      // Should not call git commit
      expect(execSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.any(Function)
      )
    })

    it('should fail when on main branch', async () => {
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(true)
      
      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {message: 'Test'},
        args: {},
      } as any)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('WORKFLOW VIOLATION'))
    })

    it('should fail when working tree is not clean', async () => {
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(false)
      
      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {message: 'Test'},
        args: {},
      } as any)

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('WORKFLOW VIOLATION'))
    })

    it('should use specific version when --version flag is provided', async () => {
      await createTestFile(tempDir, 'package.json', JSON.stringify(testPackageJson, null, 2))

      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.0'),
        updateVersion: vi.fn().mockResolvedValue(undefined),
        getVersionFiles: vi.fn().mockReturnValue(['package.json']),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {
          message: 'Test release',
          version: '2.0.0',
          'no-commit': true,
        },
        args: {},
      } as any)

      await command.run()

      expect(mockVersionManager.updateVersion).toHaveBeenCalledWith(
        '2.0.0',
        expect.any(String),
        [],
        'Test release'
      )
    })
  })
})
