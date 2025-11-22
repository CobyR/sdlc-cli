import {Command} from '@oclif/core'
import {loadConfig, getConfig, DEFAULT_CONFIG} from '../../lib/config'

export default class ConfigList extends Command {
  static description = 'List current configuration values'

  static aliases = ['c:list']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    const config = await loadConfig()
    const mergedConfig = await getConfig()

    this.log('📋 Current Configuration\n')
    this.log('-'.repeat(80))

    if (!config) {
      this.log('No config file found. Using defaults:\n')
    } else {
      this.log('Config file (.sdlc.json):\n')
    }

    // Show all config values with source indication
    const keys: Array<keyof typeof mergedConfig> = ['language', 'tracker', 'repo']
    
    keys.forEach(key => {
      const value = mergedConfig[key]
      const inFile = config && config[key] !== undefined
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
      this.log(`  ${key}: ${displayValue}${source}`)
    })

    this.log('\n' + '-'.repeat(80))
    this.log('\nNote: CLI flags override config values, which override defaults.')
  }
}

