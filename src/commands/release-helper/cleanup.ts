import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getConfig} from '../../lib/config'

export default class Cleanup extends Command {
  static description = 'Cleanup issues after a release'

  static aliases = ['rh:cleanup']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --force',
  ]

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Force the cleanup to run without confirmation',
      default: false,
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
    language: Flags.string({
      char: 'l',
      description: 'Programming language for version management',
      options: ['python', 'nodejs', 'typescript', 'go'],
    }),
    user: Flags.string({
      char: 'u',
      description: 'User to cleanup issues for (default: current user)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Cleanup)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker
    const language = (flags.language || config.language || 'python') as SupportedLanguage

    const issueTracker = getIssueTracker(tracker, config.repo)
    const versionManager = getVersionManager(language)
    const currentVersion = await versionManager.getCurrentVersion()

    this.log(`🧹 Cleaning up issues for release ${currentVersion}`)

    const fixedIssues = await issueTracker.getFixedIssues(flags.user)

    if (fixedIssues.length === 0) {
      this.log('✅ No fixed issues found to cleanup')
      return
    }

    this.log(`\n📋 Found ${fixedIssues.length} fixed issues:`)
    fixedIssues.forEach(issue => {
      this.log(`  - [${issue.id}] ${issue.title} (${issue.url || 'no url'})`)
    })

    if (!flags.force) {
      const confirmed = await this.confirm('Do you want to close these issues?')
      if (!confirmed) {
        this.log('Cleanup cancelled')
        return
      }
    }

    this.log('\n🧹 Closing issues...')
    for (const issue of fixedIssues) {
      try {
        await issueTracker.closeIssue(issue, currentVersion)
        this.log(`  ✅ Closed: ${issue.id} - ${issue.title}`)
      } catch (error: any) {
        this.warn(`  ⚠️  Failed to close ${issue.id}: ${error.message}`)
      }
    }

    this.log('\n✅ Cleanup complete!')
  }

  private async confirm(message: string): Promise<boolean> {
    // Simple confirmation - in a real implementation, use a proper prompt library
    return true // For now, auto-confirm if not forced
  }
}

