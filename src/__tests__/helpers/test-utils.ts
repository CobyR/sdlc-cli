import {mkdir, writeFile, readFile, rm} from 'fs/promises'
import {join} from 'path'
import {tmpdir} from 'os'

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(prefix: string = 'sdlc-test-'): Promise<string> {
  const tempPath = join(tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}`)
  await mkdir(tempPath, {recursive: true})
  return tempPath
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(path: string): Promise<void> {
  try {
    await rm(path, {recursive: true, force: true})
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Create a test file in a directory
 */
export async function createTestFile(dir: string, filename: string, content: string): Promise<string> {
  const filePath = join(dir, filename)
  await writeFile(filePath, content, 'utf-8')
  return filePath
}

/**
 * Read a test file
 */
export async function readTestFile(dir: string, filename: string): Promise<string> {
  const filePath = join(dir, filename)
  return await readFile(filePath, 'utf-8')
}
