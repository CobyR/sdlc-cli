import {Command, Flags} from '@oclif/core'
import {isOnMainBranch, isWorkingTreeClean, getCurrentBranch} from '../../lib/git/branch'
import {prExists} from '../../lib/git/pr'
import {ALL_VERSION_FILES} from '../../lib/version/constants'
import {
  createGitWorkflowError,
  formatErrorWithSuggestions,
  handleCommandError,
  wrapError,
} from '../../lib/errors'
import {ErrorCode} from '../../lib/errors/types'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export default class Validate extends Command {
  static description = 'Validate current state for release readiness'

  static aliases = ['rh:validate']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    this.log('🔍 Validating release readiness...')

    // Check branch
    if (await isOnMainBranch()) {
      const error = createGitWorkflowError(
        'Cannot start release from main branch',
        {
          suggestion: 'Create a feature branch first',
          command: 'git checkout -b feature/description',
        }
      )
      this.error(formatErrorWithSuggestions(
        'WORKFLOW VIOLATION',
        error.message,
        [
          'Create a feature branch first',
          'Run: git checkout -b feature/description',
        ]
      ))
    }

    const branch = await getCurrentBranch()
    this.log(`✅ Current branch: ${branch}`)

    // Check working tree
    if (!(await isWorkingTreeClean())) {
      const error = createGitWorkflowError(
        'Working tree not clean',
        {
          suggestion: 'Commit all changes before starting release',
          command: 'git add . && git commit -m "Your message"',
        }
      )
      this.error(formatErrorWithSuggestions(
        'WORKFLOW VIOLATION',
        error.message,
        [
          'Commit all changes before starting release',
          'Run: git add . && git commit -m "Your message"',
        ]
      ))
    }
    this.log('✅ Working tree is clean')

    // Check PR exists
    if (!(await prExists())) {
      const branch = await getCurrentBranch()
      const error = createGitWorkflowError(
        'Missing Pull Request',
        {
          suggestion: 'Create a PR for your branch',
          command: `gh pr create --title "[Release] Description"`,
        }
      )
      this.error(formatErrorWithSuggestions(
        'RELEASE BLOCKED',
        error.message,
        [
          `Push branch: git push origin ${branch}`,
          'Create PR: gh pr create --title "[Release] Description"',
          'Run this validation again',
        ]
      ))
    }
    this.log('✅ PR exists for current branch')

    // Check if version files have been recently updated
    // Check commits on this branch that aren't on main (PR commits)
    this.log('🔍 Checking for version bump...')
    try {
      // Get commits on this branch that aren't on main
      const {stdout: branchCommits} = await execAsync('git log main..HEAD --oneline --name-only')
      const recentFiles = branchCommits.toLowerCase()
      const versionFilesUpdated = ALL_VERSION_FILES.some(
        file => recentFiles.includes(file.toLowerCase())
      )

      if (!versionFilesUpdated) {
        const error = createGitWorkflowError(
          'Version not bumped',
          {
            suggestion: 'Bump version before releasing',
            command: 'sdlc release-helper bump-version --message "Your release message"',
          }
        )
        this.error(formatErrorWithSuggestions(
          'RELEASE BLOCKED',
          error.message,
          [
            'Run: sdlc release-helper bump-version --message "Your release message"',
            'Commit the version changes',
            'Create PR with version bump included',
            'Then run merge-and-release',
          ]
        ))
      }

      this.log('✅ Version bump detected in PR commits')
    } catch (error: any) {
      const wrappedError = wrapError(
        error,
        ErrorCode.GIT_COMMAND_ERROR,
        'Failed to check recent commits',
        {command: 'git log main..HEAD --oneline --name-only'}
      )
      handleCommandError(this, wrappedError)
    }

    this.log('\n✅ ALL CHECKS PASSED - Ready for release!')
  }
}

