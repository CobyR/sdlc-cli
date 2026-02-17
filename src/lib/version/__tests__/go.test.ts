import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {GoVersionManager} from '../go'
import {createTempDir, cleanupTempDir, createTestFile, readTestFile} from '../../../__tests__/helpers/test-utils'
import {testGoMod} from '../../../__tests__/helpers/fixtures'
import {readFile} from 'fs/promises'
import {join} from 'path'

describe('GoVersionManager', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('getCurrentVersion', () => {
    it('should read version from VERSION file', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('1.0.0')
    })

    it('should fallback to go.mod version comment', async () => {
      const goModWithVersion = `${testGoMod}
// version 2.3.4
`
      await createTestFile(tempDir, 'go.mod', goModWithVersion)
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('2.3.4')
    })

    it('should prefer VERSION file over go.mod comment', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      const goModWithVersion = `${testGoMod || ''}
// version 2.3.4
`
      await createTestFile(tempDir, 'go.mod', goModWithVersion)
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()

      expect(version).toBe('1.0.0')
    })

    it('should throw error if neither VERSION nor go.mod with version comment exists', async () => {
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      const manager = new GoVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow('Unable to find version')
    })

    it('should throw error if go.mod does not exist', async () => {
      const manager = new GoVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow('Unable to find go.mod file')
    })

    it('should handle empty VERSION file', async () => {
      await createTestFile(tempDir, 'VERSION', '')
      const manager = new GoVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow()
    })

    it('should handle VERSION file with only whitespace', async () => {
      await createTestFile(tempDir, 'VERSION', '   \n  \n  ')
      const manager = new GoVersionManager(tempDir)

      await expect(manager.getCurrentVersion()).rejects.toThrow()
    })

    it('should handle VERSION file with trailing whitespace', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0  \n')
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('1.0.0')
    })

    it('should handle VERSION file with leading whitespace', async () => {
      await createTestFile(tempDir, 'VERSION', '  1.0.0\n')
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('1.0.0')
    })

    it('should handle go.mod version comment with extra whitespace', async () => {
      const goModWithWhitespace = `${testGoMod || ''}
//   version   2.3.4   
`
      await createTestFile(tempDir, 'go.mod', goModWithWhitespace)
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('2.3.4')
    })

    it('should handle version comment in different positions', async () => {
      const goModWithCommentAtTop = `// version 2.3.4
${testGoMod || ''}
`
      await createTestFile(tempDir, 'go.mod', goModWithCommentAtTop)
      const manager = new GoVersionManager(tempDir)

      const version = await manager.getCurrentVersion()
      expect(version).toBe('2.3.4')
    })
  })

  describe('updateVersion', () => {
    it('should update VERSION file, go.mod, and CHANGELOG.md', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      const manager = new GoVersionManager(tempDir)

      const releaseDate = '2025-02-15'
      const releaseNotes = ['- Fixed bug', '- Added feature']
      const message = 'Release v1.1.0'

      await manager.updateVersion('1.1.0', releaseDate, releaseNotes, message)

      // Check VERSION file
      const versionContent = await readFile(join(tempDir, 'VERSION'), 'utf-8')
      expect(versionContent.trim()).toBe('1.1.0')

      // Check go.mod has version comment
      const goModContent = await readFile(join(tempDir, 'go.mod'), 'utf-8')
      expect(goModContent).toContain('// version 1.1.0')

      // Check CHANGELOG.md
      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain(releaseDate)
      expect(changelogContent).toContain(message)
    })

    it('should update existing version comment in go.mod', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      const goModWithVersion = `${testGoMod || ''}
// version 1.0.0
`
      await createTestFile(tempDir, 'go.mod', goModWithVersion)
      const manager = new GoVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const goModContent = await readFile(join(tempDir, 'go.mod'), 'utf-8')
      expect(goModContent).toContain('// version 1.1.0')
      expect(goModContent).not.toContain('// version 1.0.0')
    })

    it('should handle missing go.mod gracefully', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      const manager = new GoVersionManager(tempDir)

      await expect(manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')).resolves.not.toThrow()
    })

    it('should handle CHANGELOG.md without header', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      await createTestFile(tempDir, 'CHANGELOG.md', 'Some existing content without header')
      const manager = new GoVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- Change'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('# Changelog')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain('Some existing content without header')
    })

    it('should handle CHANGELOG.md with only whitespace', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      await createTestFile(tempDir, 'CHANGELOG.md', '   \n  \n  ')
      const manager = new GoVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- Change'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('# Changelog')
      expect(changelogContent).toContain('## [1.1.0]')
    })

    it('should preserve existing CHANGELOG.md entries', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      const existingChangelog = `# Changelog

## [1.0.0] - 2025-01-01
Initial release
`
      await createTestFile(tempDir, 'CHANGELOG.md', existingChangelog)
      const manager = new GoVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', ['- New feature'], 'Release')

      const changelogContent = await readFile(join(tempDir, 'CHANGELOG.md'), 'utf-8')
      expect(changelogContent).toContain('## [1.1.0]')
      expect(changelogContent).toContain('## [1.0.0]')
      expect(changelogContent).toContain('Initial release')
    })

    it('should handle adding version comment to go.mod without existing comment', async () => {
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')
      await createTestFile(tempDir, 'go.mod', testGoMod || '')
      const manager = new GoVersionManager(tempDir)

      await manager.updateVersion('1.1.0', '2025-02-15', [], 'Release')

      const goModContent = await readFile(join(tempDir, 'go.mod'), 'utf-8')
      expect(goModContent).toContain('// version 1.1.0')
    })
  })

  describe('getVersionFiles', () => {
    it('should return correct file list', () => {
      const manager = new GoVersionManager(tempDir)
      const files = manager.getVersionFiles()

      expect(files).toEqual(['VERSION', 'go.mod', 'CHANGELOG.md'])
    })
  })
})
