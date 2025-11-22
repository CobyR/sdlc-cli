import {Command, Flags} from '@oclif/core'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {isOnMainBranch, isWorkingTreeClean} from '../../lib/git/branch'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export default class BumpVersion extends Command {
  static description = 'Version bump to prepare for a release'

  static examples = [
    '<%= config.bin %> <%= command.id %> --message "Release message"',
    '<%= config.bin %> <%= command.id %> --language python --major',
  ]

  static flags = {
    language: Flags.string({
      char: 'l',
      description: 'Programming language for version management',
      options: ['python'],
      default: 'python',
    }),
    major: Flags.integer({
      char: 'M',
      description: 'Major version number',
    }),
    minor: Flags.integer({
      char: 'm',
      description: 'Minor version number',
    }),
    patch: Flags.integer({
      char: 'p',
      description: 'Patch version number',
    }),
    version: Flags.string({
      char: 'v',
      description: 'Specific version to set',
    }),
    message: Flags.string({
      description: 'Release message',
      required: true,
    }),
    'no-commit': Flags.boolean({
      description: 'Skip automatic commit of version changes',
      default: false,
    }),
    tracker: Flags.string({
      char: 't',
      description: 'Issue tracker to use',
      options: ['github'],
      default: 'github',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(BumpVersion)

    // Validate we're not on main branch
    if (await isOnMainBranch()) {
      this.error('❌ WORKFLOW VIOLATION: Cannot bump version on main branch!')
    }

    // Validate working tree is clean
    if (!(await isWorkingTreeClean())) {
      this.error('❌ WORKFLOW VIOLATION: Working tree not clean!\n   Commit all changes before bumping version')
    }

    this.log('🔢 Release Version Bump Started')

    const versionManager = getVersionManager(flags.language as SupportedLanguage)
    const previousVersion = await versionManager.getCurrentVersion()

    // Calculate next version
    let nextVersion: string
    if (flags.version) {
      if (flags.major || flags.minor || flags.patch) {
        this.error('❌ Error: Cannot specify version and major, minor, or patch')
      }
      nextVersion = flags.version
    } else {
      const [pvMajor, pvMinor, pvPatch] = previousVersion.split('.').map(Number)
      const major = flags.major ?? pvMajor
      const minor = flags.minor ?? pvMinor
      const patch = flags.patch ?? (pvPatch + 1)
      nextVersion = `${major}.${minor}.${patch}`
    }

    // Get fixed issues
    const issueTracker = getIssueTracker(flags.tracker as SupportedTracker)
    const fixedIssues = await issueTracker.getFixedIssues()

    // Create release notes
    const releaseNotes = fixedIssues.map(issue => 
      `* [${issue.id}](${issue.url || '#'}) - ${issue.title}`
    )

    // Update version files
    const releaseDate = new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
    const message = Array.isArray(flags.message) ? flags.message[0] : flags.message
    await versionManager.updateVersion(nextVersion, releaseDate, releaseNotes, message)

    this.log(`\nPrevious Version: ${previousVersion}`)
    this.log(`Next Version: ${nextVersion}`)
    this.log(`Release Date: ${releaseDate}`)
    this.log(`Message: ${flags.message}`)
    this.log('\nRelease Notes:')
    releaseNotes.forEach(note => this.log(`  ${note}`))

    // Auto-commit unless --no-commit flag
    if (!flags['no-commit']) {
      await this.commitVersionChanges(nextVersion, versionManager.getVersionFiles())
      this.log('\n✅ Version changes committed')
    } else {
      this.log('\n⚠️  Skipping automatic commit (--no-commit flag used)')
      this.log('   Please review the changes and commit them manually.')
    }
  }

  private async commitVersionChanges(version: string, files: string[]): Promise<void> {
    try {
      // Stage version files
      for (const file of files) {
        await execAsync(`git add ${file}`)
      }

      const commitMessage = `chore: Bump version to ${version}\n\n- Updated version files\n- Added release notes\n\nResolves version bump to ${version}`

      await execAsync(`git commit --no-verify -m "${commitMessage.replace(/"/g, '\\"')}"`)
    } catch (error: any) {
      this.warn(`⚠️  Error committing changes: ${error.message}`)
      this.log('   Please commit the changes manually.')
    }
  }
}

