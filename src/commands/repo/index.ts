import {Command} from '@oclif/core'

export default class Repo extends Command {
  static description = 'Repository and Git setup commands'

  static aliases = ['r']

  static examples = [
    '<%= config.bin %> <%= command.id %> init',
  ]

  async run(): Promise<void> {
    this.log('Repo - Use a subcommand like init')
  }
}
