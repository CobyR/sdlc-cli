import {Command} from '@oclif/core'

export default class WorkLabel extends Command {
  static description = 'Label management commands'

  static examples = [
    '<%= config.bin %> <%= command.id %> list',
    '<%= config.bin %> <%= command.id %> get bug',
    '<%= config.bin %> <%= command.id %> create --name "feature" --color "a2eeef"',
    '<%= config.bin %> <%= command.id %> update bug --color "d73a4a"',
    '<%= config.bin %> <%= command.id %> delete bug',
  ]

  async run(): Promise<void> {
    this.log('Label - Use a subcommand like list, get, create, update, or delete')
  }
}

