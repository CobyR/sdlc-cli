import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../../lib/issue-tracker'
import {getConfig} from '../../../lib/config'

export default class WorkLabelCreate extends Command {
  static description = 'Create a new label'

  static aliases = ['w:label:create']

  static examples = [
    '<%= config.bin %> <%= command.id %> --name "feature" --color "a2eeef"',
    '<%= config.bin %> <%= command.id %> --name "bug" --color "d73a4a" --description "Something isn\'t working"',
  ]

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Label name',
      required: true,
    }),
    color: Flags.string({
      char: 'c',
      description: 'Label color (hex code without #)',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Label description',
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkLabelCreate)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    const label = {
      name: flags.name,
      color: flags.color,
      description: flags.description,
    }

    this.log(`📝 Creating label: ${flags.name}...\n`)

    try {
      const createdLabel = await issueTracker.createLabel(label)

      this.log('✅ Label created successfully!\n')
      this.log(`🏷️  ${createdLabel.name}`)
      if (createdLabel.color) {
        this.log(`   Color: #${createdLabel.color}`)
      }
      if (createdLabel.description) {
        this.log(`   Description: ${createdLabel.description}`)
      }
    } catch (error: any) {
      this.error(`❌ Failed to create label: ${error.message}`)
    }
  }
}

