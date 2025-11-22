import {Command, Flags} from '@oclif/core'
import {getIssueTracker, SupportedTracker} from '../../../lib/issue-tracker'
import {getConfig} from '../../../lib/config'

export default class WorkLabelList extends Command {
  static description = 'List all labels in the repository'

  static aliases = ['w:label:list']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WorkLabelList)

    // Load config and merge with flags (flags override config)
    const config = await getConfig()
    const tracker = (flags.tracker || config.tracker || 'github') as SupportedTracker

    const issueTracker = getIssueTracker(tracker, config.repo)

    this.log('📋 Fetching labels...\n')

    try {
      const labels = await issueTracker.listLabels()

      if (labels.length === 0) {
        this.log('✅ No labels found')
        return
      }

      this.log(`Found ${labels.length} label(s):\n`)
      this.log('-'.repeat(80))

      labels.forEach(label => {
        const colorDisplay = label.color ? `#${label.color}` : '(no color)'
        const descDisplay = label.description || '(no description)'
        
        this.log(`🏷️  ${label.name}`)
        this.log(`   Color: ${colorDisplay}`)
        this.log(`   Description: ${descDisplay}`)
        this.log('')
      })

      this.log('-'.repeat(80))
    } catch (error: any) {
      this.error(`❌ Failed to list labels: ${error.message}`)
    }
  }
}

