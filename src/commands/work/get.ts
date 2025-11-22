import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkGet extends Command {
  static description = 'Get detailed information about a specific work item/issue'

  static aliases = ['w:get']

  static examples = [
    '<%= config.bin %> <%= command.id %> --id 42',
    '<%= config.bin %> <%= command.id %> --id 42 --tracker github',
  ]

  static flags = {
    id: Flags.string({
      char: 'i',
      description: 'Issue ID/number',
      required: true,
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkGet)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    this.log(`📋 Fetching issue #${flags.id}...\n`)

    try {
      const issue = await issueTracker.getIssueById(flags.id)

      if (!issue) {
        this.error(`❌ Issue #${flags.id} not found`)
      }

      const statusIcon = issue.status === 'open' ? '🟢' : '🔴'
      
      this.log('─'.repeat(80))
      this.log(`${statusIcon} Issue #${issue.id}`)
      this.log('─'.repeat(80))
      this.log(`Title: ${issue.title}`)
      this.log(`Status: ${issue.status}`)
      
      if (issue.assignee) {
        this.log(`Assignee: @${issue.assignee}`)
      } else {
        this.log('Assignee: (unassigned)')
      }

      if (issue.author) {
        this.log(`Author: @${issue.author}`)
      }

      if (issue.labels && issue.labels.length > 0) {
        this.log(`Labels: ${issue.labels.join(', ')}`)
      }

      if (issue.url) {
        this.log(`URL: ${issue.url}`)
      }

      if (issue.body) {
        this.log('\nDescription:')
        this.log('─'.repeat(80))
        this.log(issue.body)
      }

      this.log('─'.repeat(80))
    } catch (error: any) {
      this.error(`❌ Failed to get issue: ${error.message}`)
    }
  }
}

