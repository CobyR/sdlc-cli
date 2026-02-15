import {vi} from 'vitest'

/**
 * Mock child_process.exec for git and gh commands
 */
export function mockExec(stdout: string = '', stderr: string = '', code: number = 0) {
  return vi.fn().mockResolvedValue({
    stdout,
    stderr,
    code,
  })
}

/**
 * Mock fs/promises operations
 */
export function mockFsPromises() {
  const fsMocks = {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
    unlink: vi.fn(),
    rm: vi.fn(),
  }
  return fsMocks
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  vi.clearAllMocks()
}
