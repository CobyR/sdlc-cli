import {describe, it, expect} from 'vitest'
import {VERSION_FILES, ALL_VERSION_FILES, getVersionFilesForLanguage, isVersionFile} from '../constants'
import {NodeVersionManager} from '../nodejs'
import {PythonVersionManager} from '../python'
import {GoVersionManager} from '../go'

describe('Version File Constants', () => {
  describe('VERSION_FILES', () => {
    it('should have version files for nodejs', () => {
      expect(VERSION_FILES.nodejs).toEqual(['package.json', 'CHANGELOG.md'])
    })

    it('should have version files for typescript', () => {
      expect(VERSION_FILES.typescript).toEqual(['package.json', 'CHANGELOG.md'])
    })

    it('should have version files for python', () => {
      expect(VERSION_FILES.python).toEqual(['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA'])
    })

    it('should have version files for go', () => {
      expect(VERSION_FILES.go).toEqual(['VERSION', 'go.mod', 'CHANGELOG.md'])
    })
  })

  describe('consistency with version managers', () => {
    it('should match NodeVersionManager.getVersionFiles()', () => {
      const manager = new NodeVersionManager()
      const managerFiles = manager.getVersionFiles()
      expect(VERSION_FILES.nodejs).toEqual(managerFiles)
    })

    it('should match PythonVersionManager.getVersionFiles()', () => {
      const manager = new PythonVersionManager()
      const managerFiles = manager.getVersionFiles()
      expect(VERSION_FILES.python).toEqual(managerFiles)
    })

    it('should match GoVersionManager.getVersionFiles()', () => {
      const manager = new GoVersionManager()
      const managerFiles = manager.getVersionFiles()
      expect(VERSION_FILES.go).toEqual(managerFiles)
    })
  })

  describe('ALL_VERSION_FILES', () => {
    it('should include all files from VERSION_FILES', () => {
      const allFilesFromManagers = [
        ...VERSION_FILES.nodejs,
        ...VERSION_FILES.python,
        ...VERSION_FILES.go,
      ]
      
      // Check that all files from managers are in ALL_VERSION_FILES (case-insensitive)
      allFilesFromManagers.forEach(file => {
        const found = ALL_VERSION_FILES.some(
          allFile => allFile.toLowerCase() === file.toLowerCase()
        )
        expect(found).toBe(true)
      })
    })

    it('should include case variants for case-insensitive matching', () => {
      expect(ALL_VERSION_FILES).toContain('CHANGELOG.md')
      expect(ALL_VERSION_FILES).toContain('changelog.md')
      expect(ALL_VERSION_FILES).toContain('METADATA')
      expect(ALL_VERSION_FILES).toContain('metadata')
    })
  })

  describe('getVersionFilesForLanguage', () => {
    it('should return files for nodejs', () => {
      expect(getVersionFilesForLanguage('nodejs')).toEqual(['package.json', 'CHANGELOG.md'])
    })

    it('should return files for python', () => {
      expect(getVersionFilesForLanguage('python')).toEqual(['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA'])
    })

    it('should return files for go', () => {
      expect(getVersionFilesForLanguage('go')).toEqual(['VERSION', 'go.mod', 'CHANGELOG.md'])
    })

    it('should return files for typescript', () => {
      expect(getVersionFilesForLanguage('typescript')).toEqual(['package.json', 'CHANGELOG.md'])
    })
  })

  describe('isVersionFile', () => {
    it('should return true for known version files', () => {
      expect(isVersionFile('package.json')).toBe(true)
      expect(isVersionFile('CHANGELOG.md')).toBe(true)
      expect(isVersionFile('changelog.md')).toBe(true)
      expect(isVersionFile('pyproject.toml')).toBe(true)
      expect(isVersionFile('setup.py')).toBe(true)
      expect(isVersionFile('version_notes.md')).toBe(true)
      expect(isVersionFile('METADATA')).toBe(true)
      expect(isVersionFile('metadata')).toBe(true)
      expect(isVersionFile('VERSION')).toBe(true)
      expect(isVersionFile('go.mod')).toBe(true)
    })

    it('should return false for non-version files', () => {
      expect(isVersionFile('README.md')).toBe(false)
      expect(isVersionFile('src/index.ts')).toBe(false)
      expect(isVersionFile('test.js')).toBe(false)
      expect(isVersionFile('config.json')).toBe(false)
    })

    it('should be case-insensitive', () => {
      expect(isVersionFile('Package.Json')).toBe(true)
      expect(isVersionFile('CHANGELOG.MD')).toBe(true)
      expect(isVersionFile('Go.Mod')).toBe(true)
    })
  })
})
