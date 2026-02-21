import {Command, Flags} from '@oclif/core'
import {writeFile} from 'fs/promises'
import {existsSync} from 'fs'
import {basename} from 'path'
import {exec} from 'child_process'
import {promisify} from 'util'
import {isInsideGitRepository} from '../../lib/git/branch'
import {
  ensureGhInstalled,
  ensureGhAuth,
  createGitHubRepoAndPush,
} from '../../lib/git/repo-init'
import {formatErrorWithSuggestions} from '../../lib/errors'

const execAsync = promisify(exec)

export default class RepoInit extends Command {
  static description =
    'Initialize a new git repository in the current directory and create a GitHub remote'

  static aliases = ['r:init']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --name my-project',
    '<%= config.bin %> <%= command.id %> --no-remote',
  ]

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Repository name (default: current directory name)',
    }),
    public: Flags.boolean({
      description: 'Create a public repository',
      default: true,
      allowNo: true,
    }),
    private: Flags.boolean({
      description: 'Create a private repository',
      default: false,
    }),
    'no-remote': Flags.boolean({
      description: 'Skip creating GitHub repo and pushing; only git init and initial commit',
      default: false,
    }),
    'no-push': Flags.boolean({
      description: 'Create GitHub repo and set origin but do not push',
      default: false,
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(RepoInit)
    const cwd = process.cwd()

    const repoName = flags.name ?? basename(cwd)
    const visibility = flags.private ? 'private' : 'public'

    this.log('Initializing repository...')

    if (await isInsideGitRepository()) {
      this.error(
        formatErrorWithSuggestions(
          'Already a git repository',
          'The current directory is already inside a git repository.',
          [
            'Run this command in a different directory, or',
            'Remove the .git folder to re-initialize (not recommended).',
          ]
        )
      )
    }

    await execAsync('git init', {cwd})
    this.log('Git repository initialized.')

    const readmePath = `${cwd}/README.md`
    if (!existsSync(readmePath)) {
      await writeFile(readmePath, `# ${repoName}\n`, 'utf-8')
    }
    await execAsync('git add README.md', {cwd})
    await execAsync('git commit -m "Initial commit"', {cwd})
    this.log('Initial commit created.')

    if (flags['no-remote']) {
      this.log('Done. No remote created (--no-remote).')
      return
    }

    await ensureGhInstalled()
    await ensureGhAuth()

    const push = !flags['no-push']
    const url = await createGitHubRepoAndPush({
      name: repoName,
      visibility,
      remoteName: 'origin',
      push,
      cwd,
    })

    this.log('GitHub repository created.')
    this.log(`URL: ${url}`)
    if (!push) {
      this.log('Skipped push (--no-push). Run: git push -u origin <branch>')
    } else {
      this.log('Pushed to origin.')
    }
  }
}
