import {Command, Flags} from '@oclif/core'
import {isOnMainBranch, isWorkingTreeClean, createBranch, pullLatest} from '../../lib/git/branch'
import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export default class StartWork extends Command {
  static description = 'Safely start new development work with proper branch setup'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --branch-type feature',
  ]

  static flags = {
    'branch-type': Flags.string({
      char: 't',
      description: 'Type of branch to create',
      options: ['feature', 'bugfix', 'hotfix', 'maintenance'],
      default: 'feature',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(StartWork)

    this.log('🚀 Starting new development work...')

    // Step 1: Validate we're on main branch
    this.log('1️⃣ Validating current branch...')
    if (!(await isOnMainBranch())) {
      const {getCurrentBranch} = await import('../../lib/git/branch')
      const currentBranch = await getCurrentBranch()
      this.error(`❌ WORKFLOW VIOLATION: Must start new work from main branch!\n   Current branch: ${currentBranch}\n   Run: git checkout main`)
    }
    this.log('✅ On main branch')

    // Step 2: Check working tree is clean
    this.log('2️⃣ Checking working tree...')
    if (!(await isWorkingTreeClean())) {
      this.error('❌ WORKFLOW VIOLATION: Working tree not clean!\n   Commit or stash changes before starting new work')
    }
    this.log('✅ Working tree is clean')

    // Step 3: Pull latest from origin/main
    this.log('3️⃣ Pulling latest from origin/main...')
    try {
      await pullLatest('main')
      this.log('✅ Pulled latest changes from origin/main')
    } catch (error: any) {
      if (error.message.includes('Already up to date')) {
        this.log('✅ Already up to date with origin/main')
      } else {
        this.error(`❌ Failed to pull from origin/main: ${error.message}`)
      }
    }

    // Step 4: Create feature branch
    this.log('4️⃣ Creating feature branch...')
    const branchName = await this.promptForBranchName(flags['branch-type'])
    await createBranch(branchName)
    this.log(`✅ Created and switched to branch: ${branchName}`)

    // Step 5: Show next steps
    this.log('\n🎉 NEW WORK SETUP COMPLETE!')
    this.log('\n📋 Next steps:')
    this.log(`   • Current branch: ${branchName}`)
    this.log('   • Make your code changes')
    this.log('   • Commit with issue references')
    this.log('   • When ready for release: sdlc release-helper validate')
  }

  private async promptForBranchName(branchType: string): Promise<string> {
    // In a real implementation, use a proper prompt library
    // For now, generate a simple default name
    const timestamp = Date.now().toString().slice(-6)
    return `${branchType}/work-${timestamp}`
  }
}

