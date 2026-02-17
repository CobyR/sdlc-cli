import {describe, it, expect, beforeEach, vi} from 'vitest'
import Config from '../index'

describe('Config Command', () => {
  let command: Config
  let logSpy: any

  beforeEach(() => {
    command = new Config([], {} as any)
    logSpy = vi.spyOn(command, 'log').mockImplementation(() => {})
  })

  it('should display help message', async () => {
    await command.run()

    expect(logSpy).toHaveBeenCalledWith('Config - Use a subcommand like list, get, set, or unset')
  })
})
