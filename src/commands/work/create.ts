import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'

export default class WorkCreate extends Command {
  static description = 'Create a new work item/issue'

  static aliases = ['w:create']

  static examples = [
    '<%= config.bin %> <%= command.id %> --title "Fix bug in login"',
    '<%= config.bin %> <%= command.id %> --title "Add feature" --body "Description of the feature"',
    '<%= config.bin %> <%= command.id %> --title "Bug fix" --assignee username --label "bug"',
  ]

  static flags = {
    title: Flags.string({
      char: 't',
      description: 'Issue title',
      required: true,
    }),
    body: Flags.string({
      char: 'b',
      description: 'Issue body/description',
    }),
    assignee: Flags.string({
      char: 'a',
      description: 'Assign issue to user',
    }),
    label: Flags.string({
      char: 'l',
      description: 'Add label (can be used multiple times)',
      multiple: true,
    }),
    tracker: Flags.string({
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkCreate)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    const issue = {
      title: flags.title,
      body: flags.body,
      assignee: flags.assignee,
      labels: flags.label,
    }

    this.log(`📝 Creating issue: ${flags.title}...\n`)

    try {
      const createdIssue = await issueTracker.createIssue(issue)

      this.log('✅ Issue created successfully!\n')
      
      const statusIcon = createdIssue.status === 'open' ? '🟢' : '🔴'
      this.log(`${statusIcon} [#${createdIssue.id}] ${createdIssue.title}`)
      
      if (createdIssue.url) {
        this.log(`   ${createdIssue.url}`)
      }
      
      if (createdIssue.assignee) {
        this.log(`   Assigned to: @${createdIssue.assignee}`)
      }
      
      if (createdIssue.labels && createdIssue.labels.length > 0) {
        this.log(`   Labels: ${createdIssue.labels.join(', ')}`)
      }
    } catch (error: any) {
      this.error(`❌ Failed to create issue: ${error.message}`)
    }
  }
}

