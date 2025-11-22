import {Command} from '@oclif/core'

export default class Work extends Command {
  static description = 'Work item and issue management commands'

  static examples = [
    '<%= config.bin %> <%= command.id %> list',
    '<%= config.bin %> <%= command.id %> get --id 42',
    '<%= config.bin %> <%= command.id %> update --id 42 --title "New title"',
  ]

  async run(): Promise<void> {
    this.log('Work - Use a subcommand like list, get, or update')
  }
}

