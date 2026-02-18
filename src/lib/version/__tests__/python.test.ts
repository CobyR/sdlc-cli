import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {PythonVersionManager} from '../python'
import {createTempDir, cleanupTempDir, createTestFile, readTestFile} from '../../../__tests__/helpers/test-utils'
import {testPyprojectToml} from '../../../__tests__/helpers/fixtures'
import {readFile} from 'fs/promises'
import {join} from 'path'

describe('PythonVersionManager', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('getCurrentVersion', () => {
    it('should read version from pyproject.toml', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      const manager = new PythonVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('1.0.0')
    })

    it('should throw error if pyproject.toml does not exist', async () => {
      const manager = new PythonVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow()
    })

    it('should handle version with quotes', async () => {
      const pyprojectWithQuotes = `[project]
name = "test-project"
version = "2.3.4"
`
      await createTestFile(tempDir, 'pyproject.toml', pyprojectWithQuotes)
      const manager = new PythonVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('2.3.4')
    })

    it('should handle version with single quotes', async () => {
      const pyprojectWithSingleQuotes = `[project]
name = "test-project"
version = '2.3.4'
`
      await createTestFile(tempDir, 'pyproject.toml', pyprojectWithSingleQuotes)
      const manager = new PythonVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('2.3.4')
    })

    it('should throw error for missing version field', async () => {
      const pyprojectWithoutVersion = `[project]
name = "test-project"
`
      await createTestFile(tempDir, 'pyproject.toml', pyprojectWithoutVersion)
      const manager = new PythonVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow('Unable to find version in pyproject.toml')
    })

    it('should handle empty version string', async () => {
      const pyprojectWithEmptyVersion = `[project]
name = "test-project"
version = ""
`
      await createTestFile(tempDir, 'pyproject.toml', pyprojectWithEmptyVersion)
      const manager = new PythonVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('')
    })
  })

  describe('updateVersion', () => {
    it('should update version in pyproject.toml, setup.py, version_notes.md, and METADATA', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(tempDir, 'setup.py', "version='1.0.0'")
      const manager = new PythonVersionManager(tempDir)

      const releaseDate = '2025-02-15'
      const releaseNotes = ['- Fixed bug', '- Added feature']
      const message = 'Release v1.1.0'

      await manager.updateVersion('1.1.0', releaseDate, releaseNotes, message)

      // Check pyproject.toml
      const pyprojectContent = await readFile(join(tempDir, 'pyproject.toml'), 'utf-8')
      expect(pyprojectContent).toContain('version = "1.1.0"')

      // Check setup.py
      const setupContent = await readFile(join(tempDir, 'setup.py'), 'utf-8')
      expect(setupContent).toContain("version='1.1.0'")

      // Check version_notes.md
      const notesContent = await readFile(join(tempDir, 'version_notes.md'), 'utf-8')
      expect(notesContent).toContain('## 1.1.0')
      expect(notesContent).toContain(releaseDate)
      expect(notesContent).toContain(message)

      // Check METADATA
      const metadataContent = await readFile(join(tempDir, 'METADATA'), 'utf-8')
      expect(metadataContent).toContain(`release_date=${releaseDate}`)
    })

    it('should handle missing setup.py gracefully', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      const manager = new PythonVersionManager(tempDir)

      await expect(manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')).resolves.not.toThrow()
    })

    it('should handle existing version_notes.md file', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(tempDir, 'version_notes.md', '## 1.0.0\nPrevious notes\n')
      const manager = new PythonVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- New feature'], 'Release')

      const notesContent = await readFile(join(tempDir, 'version_notes.md'), 'utf-8')
      expect(notesContent).toContain('## 1.1.0')
      expect(notesContent).toContain('## 1.0.0')
      expect(notesContent).toContain('Previous notes')
    })

    it('should handle setup.py with different version formats', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(tempDir, 'setup.py', 'version="1.0.0"')
      const manager = new PythonVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const setupContent = await readFile(join(tempDir, 'setup.py'), 'utf-8')
      expect(setupContent).toContain("version='1.1.0'")
    })

    it('should create METADATA file with release date', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      const manager = new PythonVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const metadataContent = await readFile(join(tempDir, 'METADATA'), 'utf-8')
      expect(metadataContent).toContain('release_date=2025-02-15')
    })

    it('should handle version_notes.md with special formatting', async () => {
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(tempDir, 'version_notes.md', '## 1.0.0\nReleased on: 2025-01-01\n\n**Bold text**\n\n- List item\n')
      const manager = new PythonVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- New feature'], 'Release')

      const notesContent = await readFile(join(tempDir, 'version_notes.md'), 'utf-8')
      expect(notesContent).toContain('## 1.1.0')
      expect(notesContent).toContain('**Bold text**')
      expect(notesContent).toContain('- List item')
    })

  })

  describe('getVersionFiles', () => {
    it('should return correct file list', () => {
      const manager = new PythonVersionManager(tempDir)
      const files = manager.getVersionFiles()

      expect(files).toEqual(['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA'])
    })
  })
})
