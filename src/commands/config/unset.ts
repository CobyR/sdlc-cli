import {Command, Args} from '@oclif/core'
import {updateConfigValue, loadConfig} from '../../lib/config'

export default class ConfigUnset extends Command {
  static description = 'Remove a configuration value (revert to default)'

  static aliases = ['c:unset']

  static examples = [
    '<%= config.bin %> <%= command.id %> language',
    '<%= config.bin %> <%= command.id %> tracker',
    '<%= config.bin %> <%= command.id %> repo',
  ]

  static args = {
    key: Args.string({
      description: 'Configuration key to remove',
      required: true,
      options: ['language', 'tracker', 'repo', 'view'],
    }),
  }

  async run(): Promise<void> {
    const {args} = await this.parse(ConfigUnset)
    const key = args.key as 'language' | 'tracker' | 'repo'

    // Check if key exists in config
    const config = await loadConfig()
    if (!config || config[key] === undefined) {
      this.log(`ℹ️  ${key} is not set in configuration (already using default)`)
      return
    }

    this.log(`📝 Removing ${key} from configuration...`)

    try {
      await updateConfigValue(key, undefined)
      this.log(`✅ Configuration updated successfully`)
      this.log(`   ${key} has been removed (will use default)`)
    } catch (error: any) {
      this.error(`❌ Failed to update configuration: ${error.message}`)
    }
  }
}

