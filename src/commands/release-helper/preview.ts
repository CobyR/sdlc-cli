import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getConfig} from '../../lib/config'

export default class Preview extends Command {
  static description = 'Preview fixed issues for upcoming release'

  static aliases = ['rh:preview']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --user username',
  ]

  static flags = {
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
    language: Flags.string({
      char: 'l',
      description: 'Programming language for version management',
      options: ['python', 'nodejs', 'typescript'],
    }),
    user: Flags.string({
      char: 'u',
      description: 'User to preview issues for (default: current user)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Preview)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker
    const language = (flags.language || config.language || 'python') as SupportedLanguage

    const issueTracker = getIssueTracker(tracker, config.repo)
    const versionManager = getVersionManager(language)
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

