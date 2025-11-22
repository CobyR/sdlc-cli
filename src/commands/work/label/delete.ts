import {Command, Args, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../../lib/issue-tracker'
import {getConfig} from '../../../lib/config'

export default class WorkLabelDelete extends Command {
  static description = 'Delete a label'

  static aliases = ['w:label:delete']

  static examples = [
    '<%= config.bin %> <%= command.id %> bug',
    '<%= config.bin %> <%= command.id %> old-label',
  ]

  static args = {
    name: Args.string({
      description: 'Label name to delete',
      required: true,
    }),
  }

  static flags = {
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WorkLabelDelete)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    this.log(`🗑️  Deleting label: ${args.name}...\n`)

    try {
      await issueTracker.deleteLabel(args.name)
      this.log(`✅ Label "${args.name}" deleted successfully!`)
    } catch (error: any) {
      this.error(`❌ Failed to delete label: ${error.message}`)
    }
  }
}

