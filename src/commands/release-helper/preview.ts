import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getVersionManager, SupportedLanguage} from '../../lib/version'

export default class Preview extends Command {
  static description = 'Preview fixed issues for upcoming release'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --user username',
  ]

  static flags = {
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
      default: 'github',
    }),
    language: Flags.string({
      char: 'l',
      description: 'Programming language for version management',
      options: ['python'],
      default: 'python',
    }),
    user: Flags.string({
      char: 'u',
      description: 'User to preview issues for (default: current user)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Preview)

    const issueTracker = getIssueTracker(flags.tracker as SupportedTracker)
    const versionManager = getVersionManager(flags.language as SupportedLanguage)
    const currentVersion = await versionManager.getCurrentVersion()

    this.log(`📋 Previewing issues for release after ${currentVersion}`)

    const fixedIssues = await issueTracker.getFixedIssues(flags.user)

    if (fixedIssues.length === 0) {
      this.log('✅ No fixed issues found')
      return
    }

    this.log(`\n📋 Found ${fixedIssues.length} fixed issues:\n`)
    this.log('Release Notes Preview:')
    this.log('─'.repeat(80))

    fixedIssues.forEach(issue => {
      this.log(`* [${issue.id}](${issue.url || '#'}) - ${issue.title}`)
    })

    // Calculate next version (patch bump)
    const [major, minor, patch] = currentVersion.split('.').map(Number)
    const nextVersion = `${major}.${minor}.${patch + 1}`

    this.log('\n' + '─'.repeat(80))
    this.log(`Next version would be: ${nextVersion}`)
  }
}

