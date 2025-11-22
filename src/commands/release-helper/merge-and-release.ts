import {Command} from '@oclif/core'
import {mergePR} from '../../lib/git/pr'
import {checkoutBranch, pullLatest} from '../../lib/git/branch'
import {isOnMainBranch, isWorkingTreeClean} from '../../lib/git/branch'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export default class MergeAndRelease extends Command {
  static description = 'Merge PR and execute release process'

  static aliases = ['rh:merge-and-release']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    this.log('🔍 Pre-merge validation...')

    // Validate we're not on main
    if (await isOnMainBranch()) {
      this.error('❌ Cannot merge from main branch!')
    }

    // Check PR exists
    const {prExists} = await import('../../lib/git/pr')
    if (!(await prExists())) {
      this.error('❌ RELEASE BLOCKED: No PR exists!\n   Run: sdlc release-helper create-pr "Your Release Title"')
    }

    // Check version bump
    try {
      const {stdout} = await execAsync('git log --oneline -1 --name-only')
      const recentFiles = stdout.toLowerCase()
      const versionFilesUpdated = ['version_notes.md', 'setup.py', 'pyproject.toml', 'metadata', 'package.json'].some(
        file => recentFiles.includes(file.toLowerCase())
      )

      if (!versionFilesUpdated) {
        this.error('❌ RELEASE BLOCKED: Version not bumped!\n   Expected workflow:\n   1. Run: sdlc release-helper bump-version --message "Your release message"\n   2. Commit the version changes\n   3. Create PR with version bump included\n   4. Then run merge-and-release')
      }

      this.log('✅ Version bump detected in recent commits')
    } catch (error: any) {
      this.error(`❌ Failed to check recent commits: ${error.message}`)
    }

    // Confirm with user
    this.log('\n🚀 Ready to merge PR and execute release?')
    // In a real implementation, use a proper confirmation prompt

    // Merge PR
    this.log('🔀 Merging Pull Request...')
    await mergePR(true) // squash merge

    // Switch to main and pull
    this.log('📥 Switching to main and pulling...')
    await checkoutBranch('main')
    await pullLatest('main')

    // Run cleanup
    this.log('🧹 Running cleanup...')
    try {
      const {default: Cleanup} = await import('./cleanup')
      const cleanup = new Cleanup(this.argv, this.config)
      await cleanup.run()
    } catch (error: any) {
      this.warn(`⚠️  Cleanup failed: ${error.message}`)
    }

    this.log('🎉 RELEASE COMPLETE!')
  }
}

