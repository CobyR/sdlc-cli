import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkUpdate extends Command {
  static description = 'Update a work item/issue'

  static examples = [
    '<%= config.bin %> <%= command.id %> --id 42 --title "New title"',
    '<%= config.bin %> <%= command.id %> --id 42 --state closed',
    '<%= config.bin %> <%= command.id %> --id 42 --assignee username',
    '<%= config.bin %> <%= command.id %> --id 42 --label "bug" --label "priority:high"',
    '<%= config.bin %> <%= command.id %> --id 42 --remove-label "bug"',
  ]

  static flags = {
    id: Flags.string({
      char: 'i',
      description: 'Issue ID/number',
      required: true,
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

    this.log(`📝 Updating issue #${flags.id}...\n`)

    try {
      const updatedIssue = await issueTracker.updateIssue(flags.id, updates)

      this.log('✅ Issue updated successfully!\n')
      
      const statusIcon = updatedIssue.status === 'open' ? '🟢' : '🔴'
      this.log(`${statusIcon} [#${updatedIssue.id}] ${updatedIssue.title}`)
      
      if (updatedIssue.url) {
        this.log(`   ${updatedIssue.url}`)
      }
    } catch (error: any) {
      this.error(`❌ Failed to update issue: ${error.message}`)
    }
  }
}

