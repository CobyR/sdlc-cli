import {Command, Args} from '@oclif/core'
import {updateConfigValue, validateConfig} from '../../lib/config'
import {SDLCConfig} from '../../lib/config/types'

export default class ConfigSet extends Command {
  static description = 'Set a configuration value'

  static aliases = ['c:set']

  static examples = [
    '<%= config.bin %> <%= command.id %> language python',
    '<%= config.bin %> <%= command.id %> tracker github',
    '<%= config.bin %> <%= command.id %> repo owner/repo-name',
  ]

  static args = {
    key: Args.string({
      description: 'Configuration key to set',
      required: true,
      options: ['language', 'tracker', 'repo', 'view'],
    }),
    value: Args.string({
      description: 'Value to set',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(ConfigSet)
    const key = args.key as keyof SDLCConfig
    const value = args.value

    // Validate the value before setting
    const testConfig: SDLCConfig = {[key]: value}
    try {
      validateConfig(testConfig)
    } catch (error: any) {
      this.error(`❌ Invalid value: ${error.message}`)
    }

    // Additional validation for view field
    if (key === 'view' && value !== 'list' && value !== 'table') {
      this.error('❌ Invalid value: view must be "list" or "table"')
    }

    this.log(`📝 Setting ${key} to "${value}"...`)

    try {
      await updateConfigValue(key, value)
      this.log(`✅ Configuration updated successfully`)
      this.log(`   ${key} = ${value}`)
    } catch (error: any) {
      this.error(`❌ Failed to update configuration: ${error.message}`)
    }
  }
}

