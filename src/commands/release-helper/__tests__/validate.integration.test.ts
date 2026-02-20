import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {createTempDir, cleanupTempDir, createTestFile} from '../../../__tests__/helpers/test-utils'
import Validate from '../validate'
import * as branchLib from '../../../lib/git/branch'
import * as prLib from '../../../lib/git/pr'
import {exec} from 'child_process'

// Mock dependencies
vi.mock('../../../lib/git/branch')
vi.mock('../../../lib/git/pr')
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

describe('Validate Command - Integration Tests', () => {
  let tempDir: string
  let command: Validate

  beforeEach(async () => {
    tempDir = await createTempDir()
    command = new Validate([], {} as any)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTempDir(tempDir)
    }
  })

  describe('full workflow validation', () => {
    it('should fail when current directory is not a git repository', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(false)
      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith('The current directory is not part of a git repository.')
    })

    it('should pass all checks for valid release state', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      // Mock: not on main branch
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
      vi.mocked(branchLib.getCurrentBranch).mockResolvedValue('feature/release-1.0.0')
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(true)
      vi.mocked(prLib.prExists).mockResolvedValue(true)
      
      // Mock: git log shows version files updated
      // Match the pattern used in other tests: callback(null, {stdout, stderr})
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          if (command.includes('git log main..HEAD')) {
            callback(null, {stdout: 'commit abc123\npackage.json\nCHANGELOG.md', stderr: ''})
          } else {
            callback(null, {stdout: '', stderr: ''})
          }
        }) as any
      )

      const logSpy = vi.spyOn(command, 'log')
      const errorSpy = vi.spyOn(command, 'error')

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('🔍 Validating release readiness...')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Current branch:'))
      expect(logSpy).toHaveBeenCalledWith('✅ Working tree is clean')
      expect(logSpy).toHaveBeenCalledWith('✅ PR exists for current branch')
      expect(logSpy).toHaveBeenCalledWith('✅ Version bump detected in PR commits')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ALL CHECKS PASSED'))
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('should fail when on main branch', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(true)
      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('WORKFLOW VIOLATION'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot start release from main branch'))
    })

    it('should fail when working tree is not clean', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
      vi.mocked(branchLib.getCurrentBranch).mockResolvedValue('feature/release')
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(false)
      
      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('WORKFLOW VIOLATION'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Working tree not clean'))
    })

    it('should fail when PR does not exist', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
      vi.mocked(branchLib.getCurrentBranch).mockResolvedValue('feature/release')
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(true)
      vi.mocked(prLib.prExists).mockResolvedValue(false)
      
      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('RELEASE BLOCKED'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Missing Pull Request'))
    })

    it('should fail when version not bumped', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
      vi.mocked(branchLib.getCurrentBranch).mockResolvedValue('feature/release')
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(true)
      vi.mocked(prLib.prExists).mockResolvedValue(true)
      
      // Mock: git log shows no version files
      // Match the pattern used in other tests: callback(null, {stdout, stderr})
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          if (command.includes('git log main..HEAD')) {
            callback(null, {stdout: 'commit abc123\nREADME.md\nsrc/index.ts', stderr: ''})
          } else {
            callback(null, {stdout: '', stderr: ''})
          }
        }) as any
      )

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('RELEASE BLOCKED'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Version not bumped'))
    })

    it('should handle git log errors gracefully', async () => {
      vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
      vi.mocked(branchLib.isOnMainBranch).mockResolvedValue(false)
      vi.mocked(branchLib.getCurrentBranch).mockResolvedValue('feature/release')
      vi.mocked(branchLib.isWorkingTreeClean).mockResolvedValue(true)
      vi.mocked(prLib.prExists).mockResolvedValue(true)
      
      // Mock: git log fails
      // Match the pattern used in other tests: callback(error, {stdout, stderr})
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          if (command.includes('git log main..HEAD')) {
            callback(new Error('Git command failed'), {stdout: '', stderr: ''})
          } else {
            callback(null, {stdout: '', stderr: ''})
          }
        }) as any
      )

      const errorSpy = vi.spyOn(command, 'error').mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check recent commits'),
        expect.any(Object)
      )
    })
  })
})
