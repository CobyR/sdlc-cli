import {describe, it, expect, beforeEach, vi} from 'vitest'
import {exec} from 'child_process'
import {
  ensureGhInstalled,
  ensureGhAuth,
  createGitHubRepoAndPush,
} from '../repo-init'

vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

vi.mock('../branch', () => ({
  getCurrentBranch: vi.fn().mockResolvedValue('main'),
}))

describe('repo-init', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ensureGhInstalled', () => {
    it('should resolve when gh --version succeeds', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (callback) setImmediate(() => callback(null, {stdout: 'gh version 2.0.0', stderr: ''}))
        }) as any
      )

      await expect(ensureGhInstalled()).resolves.toBeUndefined()
    })

    it('should throw when gh is not installed', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (callback) setImmediate(() => callback(new Error('command not found: gh'), {stdout: '', stderr: 'not found'}))
        }) as any
      )

      await expect(ensureGhInstalled()).rejects.toMatchObject({
        message: expect.stringContaining('GitHub CLI'),
      })
    })
  })

  describe('ensureGhAuth', () => {
    it('should resolve when gh auth status succeeds', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (callback) setImmediate(() => callback(null, {stdout: 'Logged in', stderr: ''}))
        }) as any
      )

      await expect(ensureGhAuth()).resolves.toBeUndefined()
    })

    it('should throw when not authenticated', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (callback) setImmediate(() => callback(new Error('not logged in'), {stdout: '', stderr: ''}))
        }) as any
      )

      await expect(ensureGhAuth()).rejects.toMatchObject({
        message: expect.stringContaining('Not authenticated'),
      })
    })
  })

  describe('createGitHubRepoAndPush', () => {
    it('should create repo and return URL when push is false', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (!callback) return
          if (cmd.includes('gh repo create')) {
            setImmediate(() => callback(null, {stdout: '', stderr: ''}))
          } else if (cmd.includes('gh repo view')) {
            setImmediate(() => callback(null, {stdout: 'https://github.com/owner/repo', stderr: ''}))
          } else {
            setImmediate(() => callback(null, {stdout: '', stderr: ''}))
          }
        }) as any
      )

      const url = await createGitHubRepoAndPush({
        name: 'repo',
        visibility: 'public',
        remoteName: 'origin',
        push: false,
      })

      expect(url).toBe('https://github.com/owner/repo')
    })

    it('should create repo and push when push is true', async () => {
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (!callback) return
          setImmediate(() => callback(null, {stdout: cmd.includes('gh repo view') ? 'https://github.com/u/r' : '', stderr: ''}))
        }) as any
      )

      const url = await createGitHubRepoAndPush({
        name: 'r',
        visibility: 'public',
        remoteName: 'origin',
        push: true,
      })

      expect(url).toBe('https://github.com/u/r')
    })

    it('should fall back to HTTPS when push fails with SSH error', async () => {
      let pushAttempts = 0
      vi.mocked(exec).mockImplementation(
        ((cmd: string, opts: any, cb: any) => {
          const callback = typeof opts === 'function' ? opts : cb
          if (!callback) return
          if (cmd.includes('gh repo create')) {
            setImmediate(() => callback(null, {stdout: '', stderr: ''}))
          } else if (cmd.includes('gh api user')) {
            setImmediate(() => callback(null, {stdout: 'myuser', stderr: ''}))
          } else if (cmd.includes('git push')) {
            pushAttempts++
            if (pushAttempts === 1) {
              setImmediate(() =>
                callback(new Error('Permission denied (publickey)'), {stdout: '', stderr: 'Permission denied (publickey).'})
              )
            } else {
              setImmediate(() => callback(null, {stdout: '', stderr: ''}))
            }
          } else if (cmd.includes('gh repo view')) {
            setImmediate(() => callback(null, {stdout: 'https://github.com/myuser/myrepo', stderr: ''}))
          } else {
            setImmediate(() => callback(null, {stdout: '', stderr: ''}))
          }
        }) as any
      )

      const url = await createGitHubRepoAndPush({
        name: 'myrepo',
        visibility: 'public',
        remoteName: 'origin',
        push: true,
      })

      expect(url).toBe('https://github.com/myuser/myrepo')
      expect(pushAttempts).toBe(2)
    })
  })
})
