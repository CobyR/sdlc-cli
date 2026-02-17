import {describe, it, expect, beforeEach, vi} from 'vitest'
import ConfigUnset from '../unset'
import * as configLib from '../../../lib/config'

// Mock the config library
vi.mock('../../../lib/config', () => ({
  updateConfigValue: vi.fn(),
  loadConfig: vi.fn(),
}))

describe('ConfigUnset Command', () => {
  let command: ConfigUnset
  let logSpy: any
  let errorSpy: any
  let parseSpy: any

  beforeEach(() => {
    command = new ConfigUnset([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(command, 'error').mockImplementation(() => { throw new Error('CLI Error') })
    parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
      args: {key: 'language'},
      flags: {},
    } as any)
    vi.clearAllMocks()
  })

  describe('successful removal', () => {
    it('should remove language from config', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'python',
        tracker: 'github',
      })
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.loadConfig).toHaveBeenCalled()
      expect(configLib.updateConfigValue).toHaveBeenCalledWith('language', undefined)
      expect(logSpy).toHaveBeenCalledWith('📝 Removing language from configuration...')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
      expect(logSpy).toHaveBeenCalledWith('   language has been removed (will use default)')
    })

    it('should remove tracker from config', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'tracker'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
      })
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('tracker', undefined)
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })

    it('should remove repo from config', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'nodejs',
        repo: 'test/repo',
      })
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('repo', undefined)
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })

    it('should remove view from config', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'view'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'nodejs',
        view: 'table',
      })
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('view', undefined)
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })
  })

  describe('when key is not set', () => {
    it('should show info message when key is not in config file', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'nodejs',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('ℹ️  repo is not set in configuration (already using default)')
      expect(configLib.updateConfigValue).not.toHaveBeenCalled()
    })

    it('should show info message when config file does not exist', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue(null)

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('ℹ️  language is not set in configuration (already using default)')
      expect(configLib.updateConfigValue).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should show error when updateConfigValue fails', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {},
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'python',
      })
      vi.mocked(configLib.updateConfigValue).mockRejectedValue(new Error('Failed to write config'))
      
      // Don't throw on error for this test - just track the call
      errorSpy.mockImplementation(() => {})

      await command.run()

      expect(errorSpy).toHaveBeenCalledWith('❌ Failed to update configuration: Failed to write config')
    })
  })
})
