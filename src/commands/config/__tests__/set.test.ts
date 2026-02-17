import {describe, it, expect, beforeEach, vi} from 'vitest'
import ConfigSet from '../set'
import * as configLib from '../../../lib/config'

// Mock the config library
vi.mock('../../../lib/config', () => ({
  updateConfigValue: vi.fn(),
  validateConfig: vi.fn(),
}))

describe('ConfigSet Command', () => {
  let command: ConfigSet
  let logSpy: any
  let errorSpy: any
  let parseSpy: any

  beforeEach(() => {
    command = new ConfigSet([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(command, 'error').mockImplementation(() => { throw new Error('CLI Error') })
    parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
      args: {key: 'language', value: 'python'},
      flags: {},
    } as any)
    vi.clearAllMocks()
  })

  describe('successful updates', () => {
    it('should set language config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language', value: 'python'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.validateConfig).toHaveBeenCalledWith({language: 'python'})
      expect(configLib.updateConfigValue).toHaveBeenCalledWith('language', 'python')
      expect(logSpy).toHaveBeenCalledWith('📝 Setting language to "python"...')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
      expect(logSpy).toHaveBeenCalledWith('   language = python')
    })

    it('should set tracker config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'tracker', value: 'github'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('tracker', 'github')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })

    it('should set repo config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo', value: 'owner/repo-name'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('repo', 'owner/repo-name')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })

    it('should set view config value to list', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'view', value: 'list'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('view', 'list')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })

    it('should set view config value to table', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'view', value: 'table'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockResolvedValue(undefined)

      await command.run()

      expect(configLib.updateConfigValue).toHaveBeenCalledWith('view', 'table')
      expect(logSpy).toHaveBeenCalledWith('✅ Configuration updated successfully')
    })
  })

  describe('validation errors', () => {
    it('should show error for invalid config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language', value: '123'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockImplementation(() => {
        throw new Error('Config field "language" must be a string')
      })
      // Make error throw to stop execution (like OCLIF does)
      errorSpy.mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')

      expect(errorSpy).toHaveBeenCalledWith('❌ Invalid value: Config field "language" must be a string')
      expect(configLib.updateConfigValue).not.toHaveBeenCalled()
    })

    it('should show error for invalid view value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'view', value: 'invalid'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      // Make error throw to stop execution (like OCLIF does)
      errorSpy.mockImplementation(() => {
        throw new Error('Command error')
      })

      await expect(command.run()).rejects.toThrow('Command error')

      expect(errorSpy).toHaveBeenCalledWith('❌ Invalid value: view must be "list" or "table"')
      expect(configLib.updateConfigValue).not.toHaveBeenCalled()
    })

    it('should show error when updateConfigValue fails', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language', value: 'python'},
        flags: {},
      })
      vi.mocked(configLib.validateConfig).mockReturnValue(undefined)
      vi.mocked(configLib.updateConfigValue).mockRejectedValue(new Error('Failed to write config'))
      
      // Don't throw on error for this test - just track the call
      errorSpy.mockImplementation(() => {})

      await command.run()

      expect(errorSpy).toHaveBeenCalledWith('❌ Failed to update configuration: Failed to write config')
    })
  })
})
