import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {createTempDir, cleanupTempDir, createTestFile} from '../../../__tests__/helpers/test-utils'
import {testPyprojectToml} from '../../../__tests__/helpers/fixtures'

// Mock fs/promises before importing PythonVersionManager
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises')
  return {
    ...actual,
    readFile: vi.fn().mockImplementation((path: any, encoding?: any) => {
      return actual.readFile(path, encoding)
    }),
    writeFile: vi.fn().mockImplementation((path: any, data?: any, encoding?: any) => {
      return actual.writeFile(path, data, encoding)
    }),
  }
})

describe('PythonVersionManager Error Handling', () => {
  let tempDir: string
  let fsPromises: typeof import('fs/promises')
  let actualFsPromises: typeof import('fs/promises')

  beforeEach(async () => {
    tempDir = await createTempDir()
    fsPromises = await import('fs/promises')
    actualFsPromises = await vi.importActual<typeof import('fs/promises')>('fs/promises')
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
    vi.clearAllMocks()
  })

  it('should throw error when setup.py read fails with non-ENOENT error', async () => {
    await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
    await createTestFile(tempDir, 'setup.py', "version='1.0.0'")
    
    // Mock readFile to throw permission error for setup.py, but use actual for others
    vi.mocked(fsPromises.readFile).mockImplementation(async (path: any, encoding?: any) => {
      const pathStr = String(path)
      if (pathStr.includes('setup.py')) {
        const error: any = new Error('Permission denied')
        error.code = 'EACCES'
        throw error
      }
      // For all other files, use actual implementation
      return actualFsPromises.readFile(path, encoding)
    })
    
    // Mock writeFile to use actual implementation
    vi.mocked(fsPromises.writeFile).mockImplementation(async (path: any, data?: any, encoding?: any) => {
      return actualFsPromises.writeFile(path, data, encoding)
    })

    // Import after setting up mocks
    const {PythonVersionManager} = await import('../python')
    const manager = new PythonVersionManager(tempDir)
    
    await expect(manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')).rejects.toThrow('Permission denied')
  })

  it('should throw error when version_notes.md read fails with non-ENOENT error', async () => {
    await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
    
    // Mock readFile to throw permission error for version_notes.md
    vi.mocked(fsPromises.readFile).mockImplementation(async (path: any, encoding?: any) => {
      const pathStr = String(path)
      if (pathStr.includes('version_notes.md')) {
        const error: any = new Error('Permission denied')
        error.code = 'EACCES'
        throw error
      }
      // For other files, use actual implementation
      return actualFsPromises.readFile(path, encoding)
    })
    
    // Mock writeFile to use actual implementation
    vi.mocked(fsPromises.writeFile).mockImplementation(async (path: any, data?: any, encoding?: any) => {
      return actualFsPromises.writeFile(path, data, encoding)
    })

    // Import after mocking
    const {PythonVersionManager} = await import('../python')
    const manager = new PythonVersionManager(tempDir)
    
    await expect(manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')).rejects.toThrow('Permission denied')
  })
})
