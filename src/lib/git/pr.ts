import {exec} from 'child_process'
import {promisify} from 'util'

const execAsync = promisify(exec)

export async function prExists(): Promise<boolean> {
  try {
    await execAsync('gh pr view --json url')
    return true
  } catch {
    return false
  }
}

export async function createPR(title: string, body: string, base: string = 'main'): Promise<string> {
  // Write body to temp file
  const {writeFile, unlink} = await import('fs/promises')
  const {tmpdir} = await import('os')
  const {join} = await import('path')
  const tempFile = join(tmpdir(), `pr-body-${Date.now()}.md`)
  
  try {
    await writeFile(tempFile, body, 'utf-8')
    const {stdout} = await execAsync(`gh pr create --title "${title}" --body-file "${tempFile}" --base ${base}`)
    await unlink(tempFile)
    return stdout.trim()
  } catch (error: any) {
    await unlink(tempFile).catch(() => {})
    throw new Error(`Failed to create PR: ${error.message}`)
  }
}

export async function mergePR(squash: boolean = true): Promise<void> {
  const method = squash ? '--squash' : '--merge'
  await execAsync(`gh pr merge ${method} --delete-branch`)
}

export async function pushBranch(branch?: string): Promise<void> {
  const {getCurrentBranch} = await import('./branch')
  const branchName = branch || await getCurrentBranch()
  await execAsync(`git push origin ${branchName}`)
}

