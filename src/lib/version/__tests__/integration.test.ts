import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {NodeVersionManager} from '../nodejs'
import {PythonVersionManager} from '../python'
import {GoVersionManager} from '../go'
import {getVersionManager} from '../index'
import {createTempDir, cleanupTempDir, createTestFile} from '../../../__tests__/helpers/test-utils'
import {mkdir} from 'fs/promises'
import {testPackageJson, testPyprojectToml, testGoMod} from '../../../__tests__/helpers/fixtures'
import {readFile} from 'fs/promises'
import {join} from 'path'

describe('Version Manager Integration Tests', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('Multiple Version Managers in Same Environment', () => {
    it('should allow NodeVersionManager and PythonVersionManager in separate directories', async () => {
      const nodeDir = join(tempDir, 'node-project')
      const pythonDir = join(tempDir, 'python-project')
      
      await mkdir(nodeDir, {recursive: true})
      await mkdir(pythonDir, {recursive: true})
      await createTestFile(nodeDir, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(pythonDir, 'pyproject.toml', testPyprojectToml || '')

      const nodeManager = new NodeVersionManager(nodeDir)
      const pythonManager = new PythonVersionManager(pythonDir)

      const nodeVersion = await nodeManager.getCurrentVersion()
      const pythonVersion = await pythonManager.getCurrentVersion()

      expect(nodeVersion).toBe('1.0.0')
      expect(pythonVersion).toBe('1.0.0')
    })

    it('should allow GoVersionManager and NodeVersionManager in separate directories', async () => {
      const goDir = join(tempDir, 'go-project')
      const nodeDir = join(tempDir, 'node-project')
      
      await mkdir(goDir, {recursive: true})
      await mkdir(nodeDir, {recursive: true})
      await createTestFile(goDir, 'VERSION', '2.0.0\n')
      await createTestFile(nodeDir, 'package.json', JSON.stringify(testPackageJson, null, 2))

      const goManager = new GoVersionManager(goDir)
      const nodeManager = new NodeVersionManager(nodeDir)

      const goVersion = await goManager.getCurrentVersion()
      const nodeVersion = await nodeManager.getCurrentVersion()

      expect(goVersion).toBe('2.0.0')
      expect(nodeVersion).toBe('1.0.0')
    })

    it('should allow all three version managers in separate directories', async () => {
      const nodeDir = join(tempDir, 'node-project')
      const pythonDir = join(tempDir, 'python-project')
      const goDir = join(tempDir, 'go-project')
      
      await mkdir(nodeDir, {recursive: true})
      await mkdir(pythonDir, {recursive: true})
      await mkdir(goDir, {recursive: true})
      await createTestFile(nodeDir, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(pythonDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(goDir, 'VERSION', '3.0.0\n')

      const nodeManager = new NodeVersionManager(nodeDir)
      const pythonManager = new PythonVersionManager(pythonDir)
      const goManager = new GoVersionManager(goDir)

      const nodeVersion = await nodeManager.getCurrentVersion()
      const pythonVersion = await pythonManager.getCurrentVersion()
      const goVersion = await goManager.getCurrentVersion()

      expect(nodeVersion).toBe('1.0.0')
      expect(pythonVersion).toBe('1.0.0')
      expect(goVersion).toBe('3.0.0')
    })
  })

  describe('Factory Function Integration', () => {
    it('should create different managers for different languages in same directory', async () => {
      // Create files for different languages (simulating a monorepo scenario)
      await createTestFile(tempDir, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')
      await createTestFile(tempDir, 'VERSION', '1.0.0\n')

      const nodeManager = getVersionManager('nodejs', tempDir)
      const pythonManager = getVersionManager('python', tempDir)
      const goManager = getVersionManager('go', tempDir)

      const nodeVersion = await nodeManager.getCurrentVersion()
      const pythonVersion = await pythonManager.getCurrentVersion()
      const goVersion = await goManager.getCurrentVersion()

      expect(nodeVersion).toBe('1.0.0')
      expect(pythonVersion).toBe('1.0.0')
      expect(goVersion).toBe('1.0.0')
    })

    it('should allow sequential version updates without interference', async () => {
      await createTestFile(tempDir, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(tempDir, 'pyproject.toml', testPyprojectToml || '')

      const nodeManager = new NodeVersionManager(tempDir)
      const pythonManager = new PythonVersionManager(tempDir)

      // Update Node.js version
      await nodeManager.updateVersion('1.1.0', '2025-02-15', ['- Node update'], 'Node Release')
      
      // Update Python version
      await pythonManager.updateVersion('1.2.0', '2025-02-16', ['- Python update'], 'Python Release')

      // Verify both updates worked
      const nodeVersion = await nodeManager.getCurrentVersion()
      const pythonVersion = await pythonManager.getCurrentVersion()

      expect(nodeVersion).toBe('1.1.0')
      expect(pythonVersion).toBe('1.2.0')

      // Verify files were updated correctly
      const packageJsonContent = await readFile(join(tempDir, 'package.json'), 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)
      expect(packageJson.version).toBe('1.1.0')

      const pyprojectContent = await readFile(join(tempDir, 'pyproject.toml'), 'utf-8')
      expect(pyprojectContent).toContain('version = "1.2.0"')
    })
  })

  describe('File System Operations Isolation', () => {
    it('should not interfere when updating versions in different directories', async () => {
      const dir1 = join(tempDir, 'project1')
      const dir2 = join(tempDir, 'project2')
      
      await mkdir(dir1, {recursive: true})
      await mkdir(dir2, {recursive: true})
      await createTestFile(dir1, 'package.json', JSON.stringify(testPackageJson, null, 2))
      await createTestFile(dir2, 'package.json', JSON.stringify({...testPackageJson, version: '2.0.0'}, null, 2))

      const manager1 = new NodeVersionManager(dir1)
      const manager2 = new NodeVersionManager(dir2)

      await manager1.updateVersion('1.1.0', '2025-02-15', ['- Update 1'], 'Release 1')
      await manager2.updateVersion('2.1.0', '2025-02-15', ['- Update 2'], 'Release 2')

      const version1 = await manager1.getCurrentVersion()
      const version2 = await manager2.getCurrentVersion()

      expect(version1).toBe('1.1.0')
      expect(version2).toBe('2.1.0')

      // Verify files are isolated
      const packageJson1 = JSON.parse(await readFile(join(dir1, 'package.json'), 'utf-8'))
      const packageJson2 = JSON.parse(await readFile(join(dir2, 'package.json'), 'utf-8'))

      expect(packageJson1.version).toBe('1.1.0')
      expect(packageJson2.version).toBe('2.1.0')
    })

    it('should handle getVersionFiles independently for each manager', () => {
      const nodeManager = new NodeVersionManager(tempDir)
      const pythonManager = new PythonVersionManager(tempDir)
      const goManager = new GoVersionManager(tempDir)

      const nodeFiles = nodeManager.getVersionFiles()
      const pythonFiles = pythonManager.getVersionFiles()
      const goFiles = goManager.getVersionFiles()

      expect(nodeFiles).toEqual(['package.json', 'CHANGELOG.md'])
      expect(pythonFiles).toEqual(['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA'])
      expect(goFiles).toEqual(['VERSION', 'go.mod', 'CHANGELOG.md'])
    })
  })
})
