import {Command, Args, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../../lib/issue-tracker'
import {getConfig} from '../../../lib/config'

export default class WorkLabelUpdate extends Command {
  static description = 'Update an existing label'

  static aliases = ['w:label:update']

  static examples = [
    '<%= config.bin %> <%= command.id %> bug --color "d73a4a"',
    '<%= config.bin %> <%= command.id %> feature --name "enhancement" --description "New feature or request"',
  ]

  static args = {
    name: Args.string({
      description: 'Label name to update',
      required: true,
    }),
  }

  static flags = {
    'new-name': Flags.string({
      description: 'New label name',
    }),
    color: Flags.string({
      char: 'c',
      description: 'New label color (hex code without #)',
    }),
    description: Flags.string({
      char: 'd',
      description: 'New label description',
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(WorkLabelUpdate)

    // Validate that at least one update field is provided
    if (!flags['new-name'] && !flags.color && !flags.description) {
      this.error('❌ At least one update field must be provided (--new-name, --color, or --description)')
    }

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    const updates: any = {}
    if (flags['new-name']) {
      updates.name = flags['new-name']
    }
    if (flags.color) {
      updates.color = flags.color
    }
    if (flags.description !== undefined) {
      updates.description = flags.description
    }

    this.log(`📝 Updating label: ${args.name}...\n`)

    try {
      const updatedLabel = await issueTracker.updateLabel(args.name, updates)

      this.log('✅ Label updated successfully!\n')
      this.log(`🏷️  ${updatedLabel.name}`)
      if (updatedLabel.color) {
        this.log(`   Color: #${updatedLabel.color}`)
      }
      if (updatedLabel.description) {
        this.log(`   Description: ${updatedLabel.description}`)
      }
    } catch (error: any) {
      this.error(`❌ Failed to update label: ${error.message}`)
    }
  }
}

