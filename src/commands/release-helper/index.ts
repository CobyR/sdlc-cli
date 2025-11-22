import {Command} from '@oclif/core'

export default class ReleaseHelper extends Command {
  static description = 'Release workflow management commands'

  static examples = [
    '<%= config.bin %> <%= command.id %> validate',
    '<%= config.bin %> <%= command.id %> bump-version',
  ]

  async run(): Promise<void> {
    this.log('Release Helper - Use a subcommand like validate, bump-version, etc.')
  }
}

