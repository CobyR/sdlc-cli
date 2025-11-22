import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkList extends Command {
  static description = 'List work items/issues with filtering options'

  static aliases = ['w:list']

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
    format: Flags.string({
      char: 'f',
      description: 'Output format',
      options: ['list', 'table'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkList)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker
    const viewFormat = (flags.format || config.view || 'list') as 'list' | 'table'

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

      if (viewFormat === 'table') {
        this.renderTableView(issues)
      } else {
        this.renderListView(issues)
      }
    } catch (error: any) {
      this.error(`❌ Failed to list issues: ${error.message}`)
    }
  }

  private getStatusIcon(issue: any): string {
    // Determine status icon based on issue state and labels
    // Green for closed/completed (overrides labels), Orange for fixed, Yellow for blocked, Blue for in-progress, Red for open/new
    const statusLower = issue.status.toLowerCase()
    if (statusLower === 'closed') {
      return '🟢' // Green for completed/closed (overrides all labels)
    } else {
      // Check labels for status indicators (only for open issues)
      const labels = issue.labels?.map((l: string) => l.toLowerCase()) || []
      
      // Check if issue has fixed label (orange)
      const hasFixedLabel = labels.some((label: string) => 
        label === 'fixed'
      )
      
      // Check if issue has blocked label (yellow)
      const hasBlockedLabel = labels.some((label: string) => 
        label === 'blocked'
      )
      
      // Check if issue has in-progress label (blue)
      const hasInProgressLabel = labels.some((label: string) => 
        label.includes('in progress') || 
        label.includes('in-progress') ||
        label === 'in-progress' ||
        label === 'in progress'
      )
      
      if (hasFixedLabel) {
        return '🟠' // Orange for fixed
      } else if (hasBlockedLabel) {
        return '🟡' // Yellow for blocked
      } else if (hasInProgressLabel) {
        return '🔵' // Blue for in-progress
      } else {
        return '🔴' // Red for new/open
      }
    }
  }

  private renderListView(issues: any[]): void {
    this.log(`Found ${issues.length} issue(s):\n`)
    this.log('-'.repeat(80))

    issues.forEach(issue => {
      const statusIcon = this.getStatusIcon(issue)
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

    this.log('-'.repeat(80))
  }

  private renderTableView(issues: any[]): void {
    this.log(`Found ${issues.length} issue(s):\n`)
    
    // Calculate column widths
    const maxIdLength = Math.max(3, ...issues.map(i => i.id.length))
    const maxTitleLength = Math.min(40, Math.max(10, ...issues.map(i => i.title.length)))
    const maxAssigneeLength = Math.max(10, ...issues.map(i => (i.assignee || 'unassigned').length))
    const maxUrlLength = Math.max(30, ...issues.map(i => (i.url || '').length))
    
    // Table header
    const header = [
      'Status'.padEnd(6),
      `#${' '.repeat(maxIdLength - 1)}`,
      'Title'.padEnd(maxTitleLength),
      'Assignee'.padEnd(maxAssigneeLength),
      'Labels'.padEnd(20),
      'URL'.padEnd(maxUrlLength)
    ].join(' | ')
    
    this.log(header)
    this.log('-'.repeat(header.length))
    
    // Table rows
    issues.forEach(issue => {
      const statusIcon = this.getStatusIcon(issue)
      const id = `#${issue.id}`.padEnd(maxIdLength + 1)
      const title = issue.title.substring(0, maxTitleLength).padEnd(maxTitleLength)
      const assignee = (issue.assignee || 'unassigned').padEnd(maxAssigneeLength)
      const labels = (issue.labels && issue.labels.length > 0 
        ? issue.labels.join(', ').substring(0, 20)
        : '(none)').padEnd(20)
      const url = (issue.url || '(no url)').padEnd(maxUrlLength)
      
      const row = [
        statusIcon.padEnd(6),
        id,
        title,
        assignee,
        labels,
        url
      ].join(' | ')
      
      this.log(row)
    })
    
    this.log('-'.repeat(header.length))
  }
}

