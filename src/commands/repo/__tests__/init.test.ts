import {describe, it, expect, beforeEach, vi} from 'vitest'
import * as branchLib from '../../../lib/git/branch'
import * as repoInitLib from '../../../lib/git/repo-init'

vi.mock('../../../lib/git/branch')
vi.mock('../../../lib/git/repo-init')

vi.mock('child_process', () => {
  const exec = vi.fn((cmd: string, options: unknown, callback?: (err: null, out: {stdout: string; stderr: string}) => void) => {
    const cb = typeof options === 'function' ? options : callback
    if (cb) setImmediate(() => (cb as any)(null, {stdout: '', stderr: ''}))
  })
  return {exec}
})

vi.mock('fs', () => ({
  existsSync: vi.fn(() => false),
}))

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(() => Promise.resolve()),
}))

import RepoInit from '../init'

describe('RepoInit Command', () => {
  let command: RepoInit
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let parseSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    command = new RepoInit([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(command, 'error').mockImplementation((input: string | Error) => {
      throw new Error(typeof input === 'string' ? input : input.message)
    })
    parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
      flags: {
        name: undefined,
        public: true,
        private: false,
        'no-remote': false,
        'no-push': false,
      },
    })
    vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(false)
    vi.clearAllMocks()
  })

  it('should error when already inside a git repository', async () => {
    vi.mocked(branchLib.isInsideGitRepository).mockResolvedValue(true)
    parseSpy.mockResolvedValue({
      flags: {
        name: undefined,
        public: true,
        private: false,
        'no-remote': false,
        'no-push': false,
      },
    })

    await expect(command.run()).rejects.toThrow()

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Already a git repository')
    )
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('The current directory is already inside a git repository')
    )
  })

  it('should run git init and initial commit when --no-remote', async () => {
    parseSpy.mockResolvedValue({
      flags: {
        name: undefined,
        public: true,
        private: false,
        'no-remote': true,
        'no-push': false,
      },
    })

    await command.run()

    expect(logSpy).toHaveBeenCalledWith('Initializing repository...')
    expect(logSpy).toHaveBeenCalledWith('Git repository initialized.')
    expect(logSpy).toHaveBeenCalledWith('Initial commit created.')
    expect(logSpy).toHaveBeenCalledWith('Done. No remote created (--no-remote).')
    expect(repoInitLib.ensureGhInstalled).not.toHaveBeenCalled()
    expect(repoInitLib.ensureGhAuth).not.toHaveBeenCalled()
    expect(repoInitLib.createGitHubRepoAndPush).not.toHaveBeenCalled()
  })

  it('should create remote and push when flags default', async () => {
    vi.mocked(repoInitLib.ensureGhInstalled).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.ensureGhAuth).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.createGitHubRepoAndPush).mockResolvedValue(
      'https://github.com/owner/myproject'
    )

    parseSpy.mockResolvedValue({
      flags: {
        name: 'myproject',
        public: true,
        private: false,
        'no-remote': false,
        'no-push': false,
      },
    })

    await command.run()

    expect(repoInitLib.ensureGhInstalled).toHaveBeenCalled()
    expect(repoInitLib.ensureGhAuth).toHaveBeenCalled()
    expect(repoInitLib.createGitHubRepoAndPush).toHaveBeenCalledWith({
      name: 'myproject',
      visibility: 'public',
      remoteName: 'origin',
      push: true,
      cwd: process.cwd(),
    })
    expect(logSpy).toHaveBeenCalledWith('GitHub repository created.')
    expect(logSpy).toHaveBeenCalledWith('URL: https://github.com/owner/myproject')
    expect(logSpy).toHaveBeenCalledWith('Pushed to origin.')
  })

  it('should create remote but not push when --no-push', async () => {
    vi.mocked(repoInitLib.ensureGhInstalled).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.ensureGhAuth).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.createGitHubRepoAndPush).mockResolvedValue(
      'https://github.com/user/repo'
    )

    parseSpy.mockResolvedValue({
      flags: {
        name: 'repo',
        public: true,
        private: false,
        'no-remote': false,
        'no-push': true,
      },
    })

    await command.run()

    expect(repoInitLib.createGitHubRepoAndPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'repo',
        push: false,
      })
    )
    expect(logSpy).toHaveBeenCalledWith(
      'Skipped push (--no-push). Run: git push -u origin <branch>'
    )
  })

  it('should use --private visibility when flags.private is true', async () => {
    vi.mocked(repoInitLib.ensureGhInstalled).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.ensureGhAuth).mockResolvedValue(undefined)
    vi.mocked(repoInitLib.createGitHubRepoAndPush).mockResolvedValue(
      'https://github.com/me/private-repo'
    )

    parseSpy.mockResolvedValue({
      flags: {
        name: 'private-repo',
        public: true,
        private: true,
        'no-remote': false,
        'no-push': false,
      },
    })

    await command.run()

    expect(repoInitLib.createGitHubRepoAndPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'private-repo',
        visibility: 'private',
      })
    )
  })
})
