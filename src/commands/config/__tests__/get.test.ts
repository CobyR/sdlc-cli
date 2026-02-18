import {describe, it, expect, beforeEach, vi} from 'vitest'
import ConfigGet from '../get'
import * as configLib from '../../../lib/config'

// Mock the config library
vi.mock('../../../lib/config', () => ({
  getConfig: vi.fn(),
  loadConfig: vi.fn(),
  DEFAULT_CONFIG: {
    language: 'nodejs',
    tracker: 'github',
  },
}))

describe('ConfigGet Command', () => {
  let command: ConfigGet
  let logSpy: any
  let errorSpy: any
  let parseSpy: any

  beforeEach(() => {
    command = new ConfigGet([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(command, 'error').mockImplementation(() => { throw new Error('CLI Error') })
    parseSpy = vi.spyOn(command as any, 'parse').mockResolvedValue({
      args: {key: 'language'},
      flags: {'show-source': false},
    } as any)
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should get language config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {'show-source': false},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'python',
        tracker: 'github',
        view: 'list',
      })

      await command.run()

      expect(configLib.getConfig).toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('python')
    })

    it('should get tracker config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'tracker'},
        flags: {'show-source': false},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'list',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('github')
    })

    it('should get repo config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {'show-source': false},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        repo: 'test/repo',
        view: 'list',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('test/repo')
    })

    it('should get view config value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'view'},
        flags: {'show-source': false},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'table',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('table')
    })

    it('should return empty string for undefined value', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {'show-source': false},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'list',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('')
    })
  })

  describe('show-source flag', () => {
    it('should show source when value is from config file', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {'show-source': true},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'python',
        tracker: 'github',
        view: 'list',
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'python',
        tracker: 'github',
      })

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('python (from config file)')
    })

    it('should show default when value is from defaults', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'language'},
        flags: {'show-source': true},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'list',
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue(null)

      await command.run()

      expect(logSpy).toHaveBeenCalledWith('nodejs (default)')
    })

    it('should show not set when value is undefined', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {'show-source': true},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'list',
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue(null)

      await command.run()

      // When repo is undefined and not in file, it shows "(not set) (not set)"
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(not set)'))
    })

    it('should show not set when value is undefined and not in file', async () => {
      parseSpy.mockResolvedValue({
        args: {key: 'repo'},
        flags: {'show-source': true},
      })
      vi.mocked(configLib.getConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
        view: 'list',
      })
      vi.mocked(configLib.loadConfig).mockResolvedValue({
        language: 'nodejs',
        tracker: 'github',
      })

      await command.run()

      // When repo is undefined and not in file, it shows "(not set) (not set)"
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(not set)'))
    })
  })
})
