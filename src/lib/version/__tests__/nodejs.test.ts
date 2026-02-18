import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {NodeVersionManager} from '../nodejs'
import {createTempDir, cleanupTempDir, createTestFile, readTestFile} from '../../../__tests__/helpers/test-utils'
import {testPackageJson, testChangelog} from '../../../__tests__/helpers/fixtures'
import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'

describe('NodeVersionManager', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('getCurrentVersion', () => {
    it('should read version from package.json', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      const manager = new NodeVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('1.0.0')
    })

    it('should throw error if package.json does not exist', async () => {
      const manager = new NodeVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow()
    })

    it('should throw error if version field is missing', async () => {
      const packageJsonWithoutVersion = {name: 'test', description: 'test'}
      await createTestFile(tempDir, 'package.json', JSON.stringify(packageJsonWithoutVersion, null, 2))
      const manager = new NodeVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow('Unable to find version in package.json')
    })

    it('should throw error for invalid JSON', async () => {
      await createTestFile(tempDir, 'package.json', '{ invalid json }')
      const manager = new NodeVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow()
    })

    it('should handle empty version string', async () => {
      const packageJsonWithEmptyVersion = {name: 'test', version: ''}
      await createTestFile(tempDir, 'package.json', JSON.stringify(packageJsonWithEmptyVersion, null, 2))
      const manager = new NodeVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow('Unable to find version in package.json')
    })

    it('should handle version with whitespace', async () => {
      const packageJsonWithWhitespace = {name: 'test', version: '  1.0.0  '}
      await createTestFile(tempDir, 'package.json', JSON.stringify(packageJsonWithWhitespace, null, 2))
      const manager = new NodeVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('  1.0.0  ')
    })
  })

  describe('updateVersion', () => {
    it('should update version in package.json and CHANGELOG.md', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      await createTestFile(tempDir, 'CHANGELOG.md', testChangelog)
      const manager = new NodeVersionManager(tempDir)

      const releaseDate = '2025-02-15'
      const releaseNotes = ['- Fixed bug', '- Added feature']
      const message = 'Release v1.1.0'

      await manager.updateVersion('1.1.0', releaseDate, releaseNotes, message)

      // Check package.json
      const updatedPackageJsonContent = await readFile(join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(updatedPackageJsonContent)
      expect(packageJson.version).toBe('1.1.0')

      // Check CHANGELOG.md
      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain(releaseDate)
      expect(changelogContent).toContain(message)
      expect(changelogContent).toContain('- Fixed bug')
      expect(changelogContent).toContain('- Added feature')
    })

    it('should create CHANGELOG.md if it does not exist', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      const manager = new NodeVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('# Changelog')
      expect(changelogContent).toContain('## [1.1.0]')
    })

    it('should handle empty release notes', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      const manager = new NodeVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('## [1.1.0]')
    })

    it('should handle changelog without header', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      await createTestFile(tempDir, 'CHANGELOG.md', 'Some existing content without header')
      const manager = new NodeVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- Change'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('# Changelog')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain('Some existing content without header')
    })

    it('should handle changelog with only whitespace', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      await createTestFile(tempDir, 'CHANGELOG.md', '   \n  \n  ')
      const manager = new NodeVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- Change'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('# Changelog')
      expect(changelogContent).toContain('## [1.1.0]')
    })

    it('should handle release notes with special characters', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      const manager = new NodeVersionManager(tempDir)

      const releaseNotes = ['- Fixed bug with "quotes"', '- Added <tag> support', '- Updated & improved']
      await manager.updateVersion('1.1.0', '2025-02-15', releaseNotes, 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('- Fixed bug with "quotes"')
      expect(changelogContent).toContain('- Added <tag> support')
      expect(changelogContent).toContain('- Updated & improved')
    })

    it('should preserve existing changelog entries', async () => {
      const packageJsonContent = JSON.stringify(testPackageJson, null, 2)
      await createTestFile(tempDir, 'package.json', packageJsonContent)
      const existingChangelog = `# Changelog

## [1.0.0] - 2025-01-01
Initial release
`
      await createTestFile(tempDir, 'CHANGELOG.md', existingChangelog)
      const manager = new NodeVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- New feature'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain('## [1.0.0]')
      expect(changelogContent).toContain('Initial release')
    })
  })

  describe('getVersionFiles', () => {
    it('should return correct file list', () => {
      const manager = new NodeVersionManager(tempDir)
      const files = manager.getVersionFiles()

      expect(files).toEqual(['package.json', 'CHANGELOG.md'])
    })
  })
})
