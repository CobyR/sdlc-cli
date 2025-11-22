import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkList extends Command {
  static description = 'List work items/issues with filtering options'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --state open',
    '<%= config.bin %> <%= command.id %> --assignee username --state open',
    '<%= config.bin %> <%= command.id %> --label "bug" --label "priority:high"',
  ]

  static flags = {
    state: Flags.string({
      char: 's',
      description: 'Filter by issue state',
      options: ['open', 'closed', 'all'],
      default: 'open',
    }),
    assignee: Flags.string({
      char: 'a',
      description: 'Filter by assignee',
    }),
    author: Flags.string({
      description: 'Filter by author',
    }),
    label: Flags.string({
      char: 'l',
      description: 'Filter by label (can be used multiple times)',
      multiple: true,
    }),
    limit: Flags.integer({
      description: 'Maximum number of issues to return',
      default: 30,
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkList)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    const filters = {
      state: flags.state as 'open' | 'closed' | 'all',
      assignee: flags.assignee,
      author: flags.author,
      labels: flags.label,
      limit: flags.limit,
    }

    this.log('📋 Fetching issues...\n')

    try {
      const issues = await issueTracker.listIssues(filters)

      if (issues.length === 0) {
        this.log('✅ No issues found matching the criteria')
        return
      }

      this.log(`Found ${issues.length} issue(s):\n`)
      this.log('─'.repeat(80))

      issues.forEach(issue => {
        const statusIcon = issue.status === 'open' ? '🟢' : '🔴'
        const assigneeText = issue.assignee ? ` @${issue.assignee}` : ' (unassigned)'
        const labelsText = issue.labels && issue.labels.length > 0 
          ? ` [${issue.labels.join(', ')}]` 
          : ''

        this.log(`${statusIcon} [#${issue.id}] ${issue.title}${assigneeText}${labelsText}`)
        if (issue.url) {
          this.log(`   ${issue.url}`)
        }
        this.log('')
      })

      this.log('─'.repeat(80))
    } catch (error: any) {
      this.error(`❌ Failed to list issues: ${error.message}`)
    }
  }
}

