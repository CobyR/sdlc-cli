import {Command, Args, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../../lib/issue-tracker'
import {getConfig} from '../../../lib/config'

export default class WorkLabelGet extends Command {
  static description = 'Get details about a specific label'

  static aliases = ['w:label:get']

  static examples = [
    '<%= config.bin %> <%= command.id %> bug',
    '<%= config.bin %> <%= command.id %> enhancement',
  ]

  static args = {
    name: Args.string({
      description: 'Label name',
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
    const {args, flags} = await this.parse(WorkLabelGet)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    this.log(`📋 Fetching label: ${args.name}...\n`)

    try {
      const label = await issueTracker.getLabel(args.name)

      if (!label) {
        this.error(`❌ Label "${args.name}" not found`)
      }

      this.log('-'.repeat(80))
      this.log(`🏷️  Label: ${label.name}`)
      this.log(`   Color: ${label.color ? `#${label.color}` : '(no color)'}`)
      this.log(`   Description: ${label.description || '(no description)'}`)
      this.log('-'.repeat(80))
    } catch (error: any) {
      this.error(`❌ Failed to get label: ${error.message}`)
    }
  }
}

