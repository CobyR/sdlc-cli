import {Command} from '@oclif/core'

export default class Config extends Command {
  static description = 'Configuration management commands'

  static examples = [
    '<%= config.bin %> <%= command.id %> list',
    '<%= config.bin %> <%= command.id %> get language',
    '<%= config.bin %> <%= command.id %> set language python',
    '<%= config.bin %> <%= command.id %> unset repo',
  ]

  async run(): Promise<void> {
    this.log('Config - Use a subcommand like list, get, set, or unset')
  }
}

