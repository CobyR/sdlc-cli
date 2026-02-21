import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export async function isInsideGitRepository(): Promise<boolean> {
  try {
    const {stdout} = await execAsync('git rev-parse --is-inside-work-tree')
    return stdout.trim() === 'true'
  } catch {
    return false
  }
}

export async function getCurrentBranch(): Promise<string> {
  const {stdout} = await execAsync('git branch --show-current')
  return stdout.trim()
}

export async function isOnMainBranch(): Promise<boolean> {
  const branch = await getCurrentBranch()
  return branch === 'main' || branch === 'master'
}

export async function isWorkingTreeClean(): Promise<boolean> {
  try {
    const {stdout} = await execAsync('git status --porcelain')
    return stdout.trim() === ''
  } catch {
    return false
  }
}

export async function createBranch(branchName: string): Promise<void> {
  await execAsync(`git checkout -b ${branchName}`)
}

export async function checkoutBranch(branchName: string): Promise<void> {
  await execAsync(`git checkout ${branchName}`)
}

export async function pullLatest(branch: string = 'main'): Promise<void> {
  await execAsync(`git pull origin ${branch}`)
}

