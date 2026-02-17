import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {createTempDir, cleanupTempDir} from '../../../__tests__/helpers/test-utils'
import {testSDLCConfig} from '../../../__tests__/helpers/fixtures'
import Cleanup from '../cleanup'
import * as versionLib from '../../../lib/version'
import * as trackerLib from '../../../lib/issue-tracker'
import * as configLib from '../../../lib/config'

// Mock dependencies
vi.mock('../../../lib/version')
vi.mock('../../../lib/issue-tracker')
vi.mock('../../../lib/config')

describe('Cleanup Command - Integration Tests', () => {
  let tempDir: string
  let command: Cleanup

  beforeEach(async () => {
    tempDir = await createTempDir()
    command = new Cleanup([], {} as any)
    vi.clearAllMocks()
    vi.mocked(configLib.getConfig).mockResolvedValue(testSDLCConfig)
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTempDir(tempDir)
    }
  })

  describe('full cleanup workflow', () => {
    it('should complete cleanup workflow with fixed issues', async () => {
      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.1'),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      const fixedIssues = [
        {id: '1', title: 'Fixed bug', url: 'https://github.com/test/repo/issues/1'},
        {id: '2', title: 'Fixed feature', url: 'https://github.com/test/repo/issues/2'},
      ]

      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue(fixedIssues),
        closeIssue: vi.fn().mockResolvedValue(undefined),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {force: true},
        args: {},
      } as any)

      const logSpy = vi.spyOn(command, 'log')

      await command.run()

      expect(mockVersionManager.getCurrentVersion).toHaveBeenCalled()
      expect(mockTracker.getFixedIssues).toHaveBeenCalled()
      expect(mockTracker.closeIssue).toHaveBeenCalledTimes(2)
      expect(mockTracker.closeIssue).toHaveBeenCalledWith(fixedIssues[0], '1.0.1')
      expect(mockTracker.closeIssue).toHaveBeenCalledWith(fixedIssues[1], '1.0.1')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cleaning up issues'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 fixed issues'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cleanup complete'))
    })

    it('should handle no fixed issues gracefully', async () => {
      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.1'),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue([]),
        closeIssue: vi.fn(),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {},
        args: {},
      } as any)

      const logSpy = vi.spyOn(command, 'log')

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('✅ No fixed issues found to cleanup')
      expect(mockTracker.closeIssue).not.toHaveBeenCalled()
    })

    it('should handle errors when closing issues', async () => {
      const mockVersionManager = {
        getCurrentVersion: vi.fn().mockResolvedValue('1.0.1'),
      }
      vi.mocked(versionLib.getVersionManager).mockReturnValue(mockVersionManager as any)

      const fixedIssues = [
        {id: '1', title: 'Fixed bug', url: 'https://github.com/test/repo/issues/1'},
        {id: '2', title: 'Fixed feature', url: 'https://github.com/test/repo/issues/2'},
      ]

      const mockTracker = {
        getFixedIssues: vi.fn().mockResolvedValue(fixedIssues),
        closeIssue: vi.fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Failed to close')),
      }
      vi.mocked(trackerLib.getIssueTracker).mockReturnValue(mockTracker as any)

      const parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
        flags: {force: true},
        args: {},
      } as any)

      const logSpy = vi.spyOn(command, 'log')
      const warnSpy = vi.spyOn(command, 'warn')

      await command.run()

      expect(mockTracker.closeIssue).toHaveBeenCalledTimes(2)
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Closed: 1'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to close 2'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cleanup complete'))
    })
  })
})
