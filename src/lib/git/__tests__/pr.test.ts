import {describe, it, expect, beforeEach, vi} from 'vitest'
import {getPrUrl, prExists, createPR} from '../pr'
import {exec} from 'child_process'
import {writeFile, unlink} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  default: {
    exec: vi.fn(),
  },
}))

// Mock fs/promises
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual('fs/promises')
  return {
    ...actual,
    writeFile: vi.fn(),
    unlink: vi.fn(),
  }
})

// Mock os
vi.mock('os', () => ({
  tmpdir: vi.fn(() => '/tmp'),
  default: {
    tmpdir: vi.fn(() => '/tmp'),
  },
}))

describe('Git PR Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(writeFile).mockResolvedValue(undefined)
    vi.mocked(unlink).mockResolvedValue(undefined)
  })

  describe('getPrUrl', () => {
    it('should return PR URL when PR exists', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '{"url":"https://github.com/test/repo/pull/1"}', stderr: ''})
        }) as any
      )

      const url = await getPrUrl()

      expect(url).toBe('https://github.com/test/repo/pull/1')
    })

    it('should return null when PR does not exist', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('no pull request found'), {stdout: '', stderr: 'no pull request found'})
        }) as any
      )

      const url = await getPrUrl()

      expect(url).toBe(null)
    })

    it('should return null when url field is missing', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '{}', stderr: ''})
        }) as any
      )

      const url = await getPrUrl()

      expect(url).toBe(null)
    })
  })

  describe('prExists', () => {
    it('should return true when PR exists', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '{"url":"https://github.com/test/repo/pull/1"}', stderr: ''})
        }) as any
      )

      const exists = await prExists()

      expect(exists).toBe(true)
    })

    it('should return false when PR does not exist', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('no pull request found'), {stdout: '', stderr: 'no pull request found'})
        }) as any
      )

      const exists = await prExists()

      expect(exists).toBe(false)
    })
  })

  describe('createPR', () => {
    it('should create PR with title and body', async () => {
      const mockOutput = 'https://github.com/test/repo/pull/42'
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )

      const result = await createPR('Test PR', 'PR body', 'main')

      expect(result).toBe(mockOutput.trim())
      expect(vi.mocked(writeFile)).toHaveBeenCalled()
      expect(vi.mocked(unlink)).toHaveBeenCalled()
    })

    it('should use default base branch', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'https://github.com/test/repo/pull/42', stderr: ''})
        }) as any
      )

      await createPR('Test PR', 'PR body')

      expect(vi.mocked(exec)).toHaveBeenCalled()
      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--base main')
    })
  })
})
