import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {loadConfig, getConfig, saveConfig, updateConfigValue, validateConfig} from '../index'
import {createTempDir, cleanupTempDir, createTestFile} from '../../../__tests__/helpers/test-utils'
import {testSDLCConfig} from '../../../__tests__/helpers/fixtures'
import {readFile} from 'fs/promises'
import {join} from 'path'

describe('Config Management', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await createTempDir()
    // Change working directory for tests
    process.chdir(tempDir)
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('loadConfig', () => {
    it('should load config from .sdlc.json', async () => {
      const configContent = JSON.stringify(testSDLCConfig, null, 2)
      await createTestFile(tempDir, '.sdlc.json', configContent)

      const config = await loadConfig(tempDir)

      expect(config).not.toBeNull()
      expect(config?.language).toBe('nodejs')
      expect(config?.tracker).toBe('github')
      expect(config?.repo).toBe('test/repo')
    })

    it('should return null if config file does not exist', async () => {
      const config = await loadConfig(tempDir)

      expect(config).toBeNull()
    })

    it('should throw error for invalid JSON', async () => {
      await createTestFile(tempDir, '.sdlc.json', '{ invalid json }')

      await expect(loadConfig(tempDir)).rejects.toThrow('Invalid JSON')
    })
  })

  describe('getConfig', () => {
    it('should return merged config with defaults', async () => {
      const config = await getConfig(tempDir)

      expect(config.language).toBe('nodejs')
      expect(config.tracker).toBe('github')
    })

    it('should merge file config with defaults', async () => {
      const fileConfig = {language: 'python', repo: 'custom/repo'}
      await createTestFile(tempDir, '.sdlc.json', JSON.stringify(fileConfig, null, 2))

      const config = await getConfig(tempDir)

      expect(config.language).toBe('python')
      expect(config.tracker).toBe('github') // from defaults
      expect(config.repo).toBe('custom/repo')
    })
  })

  describe('saveConfig', () => {
    it('should save config to .sdlc.json', async () => {
      const configToSave = {...testSDLCConfig}
      await saveConfig(configToSave, tempDir)

      const content = await readFile(join(tempDir, '.sdlc.json'), 'utf-8')
      const saved = JSON.parse(content)

      expect(saved.language).toBe('nodejs')
      expect(saved.tracker).toBe('github')
    })

    it('should validate config before saving', async () => {
      const invalidConfig = {language: 123} as any

      await expect(saveConfig(invalidConfig, tempDir)).rejects.toThrow()
    })
  })

  describe('updateConfigValue', () => {
    it('should update existing config value', async () => {
      await createTestFile(tempDir, '.sdlc.json', JSON.stringify({language: 'nodejs'}, null, 2))

      await updateConfigValue('language', 'python', tempDir)

      const config = await loadConfig(tempDir)
      expect(config?.language).toBe('python')
    })

    it('should add new config value', async () => {
      await createTestFile(tempDir, '.sdlc.json', JSON.stringify({language: 'nodejs'}, null, 2))

      await updateConfigValue('repo', 'new/repo', tempDir)

      const config = await loadConfig(tempDir)
      expect(config?.repo).toBe('new/repo')
    })

    it('should remove config value when set to undefined', async () => {
      await createTestFile(tempDir, '.sdlc.json', JSON.stringify({language: 'nodejs', repo: 'test/repo'}, null, 2))

      await updateConfigValue('repo', undefined, tempDir)

      const config = await loadConfig(tempDir)
      expect(config?.repo).toBeUndefined()
    })

    it('should delete config file when all values removed', async () => {
      await createTestFile(tempDir, '.sdlc.json', JSON.stringify({language: 'nodejs'}, null, 2))

      await updateConfigValue('language', undefined, tempDir)

      const config = await loadConfig(tempDir)
      expect(config).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const validConfig = {...testSDLCConfig} as any
      expect(() => validateConfig(validConfig)).not.toThrow()
    })

    it('should allow any string for language', () => {
      const configWithCustomLanguage = {language: 'invalid'} as any
      expect(() => validateConfig(configWithCustomLanguage)).not.toThrow()
    })

    it('should throw error for invalid view', () => {
      const invalid = {view: 'invalid'} as any
      expect(() => validateConfig(invalid)).toThrow()
    })

    it('should throw error for non-object', () => {
      expect(() => validateConfig(null as any)).toThrow()
      expect(() => validateConfig('string' as any)).toThrow()
    })
  })
})
