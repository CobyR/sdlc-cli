import {Command} from '@oclif/core'
import {readFile} from 'fs/promises'
import {join} from 'path'
import {isInsideGitRepository, isOnMainBranch, isWorkingTreeClean, getCurrentBranch} from '../../lib/git/branch'
import {getPrUrl} from '../../lib/git/pr'
import {ALL_VERSION_FILES} from '../../lib/version/constants'
import {
  createGitWorkflowError,
  formatErrorWithSuggestions,
  handleCommandError,
  wrapError,
} from '../../lib/errors'
import {ErrorCode} from '../../lib/errors/types'
import {getConfig} from '../../lib/config'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {
  CHANGELOG_FILENAME,
  extractVersionBlock,
  countChangesInVersionBlock,
  updateChangelogForVersion,
  getFirstVersionInChangelog,
} from '../../lib/changelog'
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

    if (!(await isInsideGitRepository())) {
      this.error('The current directory is not part of a git repository.')
    }

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
    const prUrl = await getPrUrl()
    if (!prUrl) {
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
    this.log(`✅ PR exists for current branch: ${prUrl}`)

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

      // CHANGELOG sync: compare changes count with fixed issues for the version being released.
      // Use the first (newest) version in CHANGELOG when it exists, so we don't overwrite an older
      // version's block (e.g. package.json still 0.1.2 but CHANGELOG already has 0.1.3 for this branch).
      const config = await getConfig()
      const language = (config.language || 'nodejs') as SupportedLanguage
      const tracker = (config.tracker || 'github') as SupportedTracker
      const versionManager = getVersionManager(language)
      const packageVersion = await versionManager.getCurrentVersion()
      const issueTracker = getIssueTracker(tracker, config.repo)
      let fixedIssues = await issueTracker.getFixedIssues()
      // Scope to issues referenced in the current PR body (Closes #11, #12 or #11, #12) when present
      try {
        const {stdout: prJson} = await execAsync('gh pr view --json body')
        const pr = JSON.parse(prJson) as {body?: string}
        const body = pr?.body ?? ''
        const refs = new Set<string>()
        for (const m of body.matchAll(/#(\d+)/g)) {
          refs.add(m[1])
        }
        if (refs.size > 0) {
          const scoped = fixedIssues.filter(issue => refs.has(issue.id))
          if (scoped.length > 0) {
            fixedIssues = scoped
          }
        }
      } catch {
        // Keep all fixed issues if we can't get PR body
      }
      const fixedCount = fixedIssues.length

      let changelogPath: string
      let changelogContent: string
      try {
        changelogPath = join(process.cwd(), CHANGELOG_FILENAME)
        changelogContent = await readFile(changelogPath, 'utf-8')
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException
        if (e.code !== 'ENOENT') {
          this.warn(`Could not read CHANGELOG.md: ${e.message}`)
        }
        changelogContent = ''
        changelogPath = join(process.cwd(), CHANGELOG_FILENAME)
      }

      const firstChangelogVersion = getFirstVersionInChangelog(changelogContent)
      const version =
        firstChangelogVersion !== null ? firstChangelogVersion : packageVersion

      let changelogCount = 0
      if (changelogContent) {
        const versionBlock = extractVersionBlock(changelogContent, version)
        if (versionBlock !== null) {
          changelogCount = countChangesInVersionBlock(versionBlock)
        }
      }

      if (changelogCount !== fixedCount) {
        this.log('📝 CHANGELOG out of sync with fixed issues, updating...')
        await updateChangelogForVersion(process.cwd(), version, fixedIssues)
        try {
          await execAsync('git add CHANGELOG.md')
          await execAsync(`git commit -m "chore: Update CHANGELOG.md for version ${version}"`)
          this.log('✅ CHANGELOG.md committed')
          await execAsync('git push origin HEAD')
          this.log('✅ CHANGELOG.md pushed to origin')
        } catch (gitError: unknown) {
          const msg = gitError instanceof Error ? gitError.message : String(gitError)
          this.warn(`CHANGELOG updated locally but git commit/push failed: ${msg}`)
        }
      } else {
        this.log('✅ CHANGELOG in sync with fixed issues')
      }
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

