import {Command} from '@oclif/core'
import {exec} from 'child_process'
import {promisify} from 'util'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'
import {ALL_VERSION_FILES} from '../../lib/version/constants'
import {updateChangelogForVersion} from '../../lib/changelog'

const execAsync = promisify(exec)

export default class UpdateChangelog extends Command {
  static description = 'Update CHANGELOG.md for the current bumped version (run after bump-version)'

  static aliases = ['rh:update-changelog']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    this.log('📝 Updating CHANGELOG for current version...')

    // 1. Version-bump guard: only run if branch has a version-bump commit
    try {
      const {stdout: branchCommits} = await execAsync('git log main..HEAD --oneline --name-only')
      const recentFiles = branchCommits.toLowerCase()
      const versionFilesUpdated = ALL_VERSION_FILES.some(
        file => recentFiles.includes(file.toLowerCase()),
      )
      if (!versionFilesUpdated) {
        this.error(
          'No version bump found on this branch.\n   Run: sdlc release-helper bump-version --message "Your release message" first, then run update-changelog.',
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(`Failed to check branch commits: ${message}`)
    }

    const config = await getConfig()
    const language = (config.language || 'nodejs') as SupportedLanguage
    const tracker = (config.tracker || 'github') as SupportedTracker

    const versionManager = getVersionManager(language)
    const version = await versionManager.getCurrentVersion()

    const issueTracker = getIssueTracker(tracker, config.repo)
    const fixedIssues = await issueTracker.getFixedIssues()

    await updateChangelogForVersion(process.cwd(), version, fixedIssues)
    this.log(`✅ CHANGELOG.md updated for version ${version}`)
  }
}
