import {Command, Flags, Args} from '@oclif/core'
import {getConfig, DEFAULT_CONFIG} from '../../lib/config'

export default class ConfigGet extends Command {
  static description = 'Get a specific configuration value'

  static aliases = ['c:get']

  static examples = [
    '<%= config.bin %> <%= command.id %> language',
    '<%= config.bin %> <%= command.id %> tracker',
    '<%= config.bin %> <%= command.id %> repo',
  ]

  static args = {
    key: Args.string({
      description: 'Configuration key to get',
      required: true,
      options: ['language', 'tracker', 'repo', 'view'],
    }),
  }

  static flags = {
    'show-source': Flags.boolean({
      description: 'Show where the value comes from (config file, default, etc.)',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(ConfigGet)
    const key = args.key as 'language' | 'tracker' | 'repo'

    const config = await getConfig()
    const value = config[key]

    if (flags['show-source']) {
      const {loadConfig} = await import('../../lib/config')
      const fileConfig = await loadConfig()
      const inFile = fileConfig && fileConfig[key] !== undefined
      const isDefault = !inFile && DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG] === value

      let source = ''
      if (inFile) {
        source = ' (from config file)'
      } else if (isDefault) {
        source = ' (default)'
      } else {
        source = ' (not set)'
      }

      const displayValue = value !== undefined ? String(value) : '(not set)'
      this.log(`${displayValue}${source}`)
    } else {
      const displayValue = value !== undefined ? String(value) : ''
      this.log(displayValue)
    }
  }
}

