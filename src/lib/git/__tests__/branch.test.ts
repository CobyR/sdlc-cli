import {describe, it, expect, beforeEach, vi} from 'vitest'
import {getCurrentBranch, isOnMainBranch, isWorkingTreeClean} from '../branch'
import {mockExec, resetMocks} from '../../../__tests__/helpers/mocks'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

describe('Git Branch Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'feature/test-branch\n', stderr: ''})
        }) as any
      )

      const branch = await getCurrentBranch()

      expect(branch).toBe('feature/test-branch')
    })

    it('should trim whitespace from branch name', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '  main  \n', stderr: ''})
        }) as any
      )

      const branch = await getCurrentBranch()

      expect(branch).toBe('main')
    })
  })

  describe('isOnMainBranch', () => {
    it('should return true for main branch', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'main\n', stderr: ''})
        }) as any
      )

      const result = await isOnMainBranch()

      expect(result).toBe(true)
    })

    it('should return true for master branch', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'master\n', stderr: ''})
        }) as any
      )

      const result = await isOnMainBranch()

      expect(result).toBe(true)
    })

    it('should return false for feature branch', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'feature/test\n', stderr: ''})
        }) as any
      )

      const result = await isOnMainBranch()

      expect(result).toBe(false)
    })
  })

  describe('isWorkingTreeClean', () => {
    it('should return true when working tree is clean', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const result = await isWorkingTreeClean()

      expect(result).toBe(true)
    })

    it('should return false when there are uncommitted changes', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'M  src/file.ts\n', stderr: ''})
        }) as any
      )

      const result = await isWorkingTreeClean()

      expect(result).toBe(false)
    })

    it('should return false on git error', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('error'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const result = await isWorkingTreeClean()

      expect(result).toBe(false)
    })
  })
})
