import {exec} from 'child_process'
import {promisify} from 'util'
import {createGitHubRepoAndPushOptions} from './repo-init-types'
import {wrapError} from '../errors'
import {ErrorCode} from '../errors/types'

const execAsync = promisify(exec)

/**
 * Ensure GitHub CLI is installed.
 */
export async function ensureGhInstalled(): Promise<void> {
  try {
    await execAsync('gh --version')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw wrapError(
      err,
      ErrorCode.GITHUB_CLI_ERROR,
      'GitHub CLI (gh) is not installed or not in PATH',
      {
        suggestion: 'Install GitHub CLI from https://cli.github.com/',
        command: 'gh --version',
      }
    )
  }
}

/**
 * Ensure user is authenticated with GitHub CLI.
 */
export async function ensureGhAuth(): Promise<void> {
  try {
    await execAsync('gh auth status')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw wrapError(
      err,
      ErrorCode.GITHUB_CLI_ERROR,
      'Not authenticated with GitHub CLI',
      {
        suggestion: 'Run gh auth login to authenticate',
        command: 'gh auth login',
      }
    )
  }
}

function isSshPushError(stderr: string): boolean {
  const lower = stderr.toLowerCase()
  return (
    lower.includes('permission denied (publickey)') ||
    lower.includes('could not read from remote repository')
  )
}

/**
 * Get the current GitHub username (owner) from gh.
 */
async function getGhOwner(): Promise<string> {
  const {stdout} = await execAsync('gh api user -q .login')
  return stdout.trim()
}

/**
 * Create GitHub repo and optionally push, with HTTPS fallback if SSH push fails.
 */
export async function createGitHubRepoAndPush(
  options: createGitHubRepoAndPushOptions
): Promise<string> {
  const {name, visibility, remoteName, push, cwd} = options
  const visibilityFlag = visibility === 'private' ? '--private' : '--public'

  const execOpts = cwd ? {cwd} : {}

  // gh repo create <name> --public|--private --source=. --remote=origin
  // We do not use --push so we can run git push ourselves and fall back to HTTPS if SSH fails.
  const createCmd = `gh repo create ${name} ${visibilityFlag} --source=. --remote=${remoteName}`

  try {
    await execAsync(createCmd, execOpts)
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    const stderr = (error as {stderr?: string})?.stderr ?? ''
    throw wrapError(
      err,
      ErrorCode.GITHUB_CLI_ERROR,
      `Failed to create GitHub repository: ${err.message}`,
      {suggestion: 'Check gh auth status and repo name availability', command: createCmd}
    )
  }

  // If we don't need to push, get URL and return
  if (!push) {
    const {stdout} = await execAsync(
      `gh repo view ${name} --json url -q .url`,
      execOpts
    )
    return stdout.trim()
  }

  // Push ourselves so we can fall back to HTTPS if SSH fails
  const branch = await (await import('./branch')).getCurrentBranch()
  const pushCmd = `git push -u ${remoteName} ${branch}`

  try {
    await execAsync(pushCmd, execOpts)
  } catch (pushError: unknown) {
    const err = pushError instanceof Error ? pushError : new Error(String(pushError))
    const stderr = (pushError as {stderr?: string})?.stderr ?? err.message

    if (!isSshPushError(stderr)) {
      throw wrapError(
        err,
        ErrorCode.GIT_COMMAND_ERROR,
        `Push failed: ${err.message}`,
        {command: pushCmd}
      )
    }

    // SSH failed: switch remote to HTTPS and retry
    const owner = await getGhOwner()
    const httpsUrl = `https://github.com/${owner}/${name}.git`
    await execAsync(`git remote set-url ${remoteName} ${httpsUrl}`, execOpts)
    await execAsync(pushCmd, execOpts)
  }

  const {stdout} = await execAsync(
    `gh repo view ${name} --json url -q .url`,
    execOpts
  )
  return stdout.trim()
}
