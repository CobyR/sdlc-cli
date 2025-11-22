import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkUpdate extends Command {
  static description = 'Update work item(s)/issue(s)'

  static aliases = ['w:update']

  static examples = [
    '<%= config.bin %> <%= command.id %> --id 42 --title "New title"',
    '<%= config.bin %> <%= command.id %> --id 42 --state closed',
    '<%= config.bin %> <%= command.id %> --id 42 --assignee username',
    '<%= config.bin %> <%= command.id %> --id 42 --label "bug" --label "priority:high"',
    '<%= config.bin %> <%= command.id %> --id 42 --remove-label "bug"',
    '<%= config.bin %> <%= command.id %> --id 1 --id 2 --id 3 --assignee username',
    '<%= config.bin %> <%= command.id %> --id 1,2,3 --label "in-progress"',
  ]

  static flags = {
    id: Flags.string({
      char: 'i',
      description: 'Issue ID/number (can be used multiple times or comma-separated)',
      required: true,
      multiple: true,
    }),
    title: Flags.string({
      char: 't',
      description: 'Update issue title',
    }),
    body: Flags.string({
      char: 'b',
      description: 'Update issue body/description',
    }),
    state: Flags.string({
      char: 's',
      description: 'Update issue state',
      options: ['open', 'closed'],
    }),
    assignee: Flags.string({
      char: 'a',
      description: 'Update assignee',
    }),
    label: Flags.string({
      char: 'l',
      description: 'Add label (can be used multiple times)',
      multiple: true,
    }),
    'remove-label': Flags.string({
      description: 'Remove label (can be used multiple times)',
      multiple: true,
    }),
    tracker: Flags.string({
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkUpdate)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    // Validate that at least one update field is provided
    if (!flags.title && !flags.body && !flags.state && !flags.assignee && 
        (!flags.label || flags.label.length === 0) && 
        (!flags['remove-label'] || flags['remove-label'].length === 0)) {
      this.error('❌ At least one update field must be provided (--title, --body, --state, --assignee, --label, or --remove-label)')
    }

    // Parse issue IDs - support multiple flags and comma-separated values
    const issueIds: string[] = []
    for (const idFlag of flags.id) {
      // Split by comma and add each ID
      const ids = idFlag.split(',').map(id => id.trim()).filter(id => id.length > 0)
      issueIds.push(...ids)
    }

    if (issueIds.length === 0) {
      this.error('❌ At least one issue ID must be provided')
    }

    // Remove duplicates
    const uniqueIds = [...new Set(issueIds)]

    const updates: any = {}

    if (flags.title) {
      updates.title = flags.title
    }

    if (flags.body !== undefined) {
      updates.body = flags.body
    }

    if (flags.state) {
      updates.state = flags.state as 'open' | 'closed'
    }

    if (flags.assignee) {
      updates.assignee = flags.assignee
    }

    if (flags.label && flags.label.length > 0) {
      updates.labels = flags.label
    }

    if (flags['remove-label'] && flags['remove-label'].length > 0) {
      updates.removeLabels = flags['remove-label']
    }

    // Batch update all issues
    const isBatch = uniqueIds.length > 1
    if (isBatch) {
      this.log(`📝 Updating ${uniqueIds.length} issue(s)...\n`)
    }

    const results: Array<{id: string; success: boolean; issue?: any; error?: string}> = []

    for (const issueId of uniqueIds) {
      if (!isBatch) {
        this.log(`📝 Updating issue #${issueId}...\n`)
      }

      try {
        const updatedIssue = await issueTracker.updateIssue(issueId, updates)
        results.push({id: issueId, success: true, issue: updatedIssue})
      } catch (error: any) {
        results.push({id: issueId, success: false, error: error.message})
      }
    }

    // Display results
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    if (successful.length > 0) {
      this.log(`✅ Successfully updated ${successful.length} issue(s):\n`)
      successful.forEach(result => {
        if (result.issue) {
          const statusIcon = result.issue.status === 'open' ? '🟢' : '🔴'
          this.log(`${statusIcon} [#${result.issue.id}] ${result.issue.title}`)
          if (result.issue.url) {
            this.log(`   ${result.issue.url}`)
          }
        }
      })
    }

    if (failed.length > 0) {
      this.log(`\n❌ Failed to update ${failed.length} issue(s):\n`)
      failed.forEach(result => {
        this.log(`   #${result.id}: ${result.error}`)
      })
    }

    // Exit with error if any failed
    if (failed.length > 0) {
      this.exit(1)
    }
  }
}

