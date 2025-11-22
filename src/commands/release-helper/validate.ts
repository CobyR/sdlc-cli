import {Command, Flags} from '@oclif/core'
import {isOnMainBranch, isWorkingTreeClean, getCurrentBranch} from '../../lib/git/branch'
import {prExists} from '../../lib/git/pr'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export default class Validate extends Command {
  static description = 'Validate current state for release readiness'

  static aliases = ['rh:validate']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    this.log('🔍 Validating release readiness...')

    // Check branch
    if (await isOnMainBranch()) {
      this.error('❌ WORKFLOW VIOLATION: Cannot start release from main branch!\n   Create a feature branch first: git checkout -b feature/description')
    }

    const branch = await getCurrentBranch()
    this.log(`✅ Current branch: ${branch}`)

    // Check working tree
    if (!(await isWorkingTreeClean())) {
      this.error('❌ WORKFLOW VIOLATION: Working tree not clean!\n   Commit all changes before starting release')
    }
    this.log('✅ Working tree is clean')

    // Check PR exists
    if (!(await prExists())) {
      this.error('❌ RELEASE BLOCKED: Missing Pull Request\n   Next steps:\n   1. Push branch: git push origin <branch>\n   2. Create PR: gh pr create --title "[Release] Description"\n   3. Run this validation again')
    }
    this.log('✅ PR exists for current branch')

    // Check if version files have been recently updated
    // Check commits on this branch that aren't on main (PR commits)
    this.log('🔍 Checking for version bump...')
    try {
      // Get commits on this branch that aren't on main
      const {stdout: branchCommits} = await execAsync('git log main..HEAD --oneline --name-only')
      const recentFiles = branchCommits.toLowerCase()
      const versionFiles = ['version_notes.md', 'setup.py', 'pyproject.toml', 'metadata', 'package.json', 'changelog.md']
      const versionFilesUpdated = versionFiles.some(
        file => recentFiles.includes(file.toLowerCase())
      )

      if (!versionFilesUpdated) {
        this.error('❌ RELEASE BLOCKED: Version not bumped!\n   Expected workflow:\n   1. Run: sdlc release-helper bump-version --message "Your release message"\n   2. Commit the version changes\n   3. Create PR with version bump included\n   4. Then run merge-and-release')
      }

      this.log('✅ Version bump detected in PR commits')
    } catch (error: any) {
      this.error(`❌ Failed to check recent commits: ${error.message}`)
    }

    this.log('\n✅ ALL CHECKS PASSED - Ready for release!')
  }
}

