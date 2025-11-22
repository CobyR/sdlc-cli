import {readFile, access} from 'fs/promises'
import {join} from 'path'
import {constants} from 'fs'
import {SDLCConfig, DEFAULT_CONFIG} from './types'

const CONFIG_FILE_NAME = '.sdlc.json'

/**
 * Load config from .sdlc.json in the project root
 * @param rootDir - Root directory to search for config (default: process.cwd())
 * @returns Config object or null if file doesn't exist
 */
export async function loadConfig(rootDir: string = process.cwd()): Promise<SDLCConfig | null> {
  const configPath = join(rootDir, CONFIG_FILE_NAME)

  try {
    // Check if file exists
    await access(configPath, constants.F_OK)
    
    // Read and parse config file
    const content = await readFile(configPath, 'utf-8')
    const config = JSON.parse(content) as SDLCConfig
    
    // Validate config
    validateConfig(config)
    
    return config
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Config file doesn't exist - that's okay, use defaults
      return null
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${CONFIG_FILE_NAME}: ${error.message}`)
    }
    
    throw error
  }
}

/**
 * Get a config value with fallback to default
 * @param config - Config object (can be null)
 * @param key - Config key to get
 * @param defaultValue - Default value if not in config
 * @returns Config value or default
 */
export function getConfigValue<T>(config: SDLCConfig | null, key: keyof SDLCConfig, defaultValue: T): T {
  if (!config) {
    return defaultValue
  }
  
  const value = config[key]
  return (value !== undefined ? value : defaultValue) as T
}

/**
 * Validate config structure
 * @param config - Config object to validate
 * @throws Error if config is invalid
 */
export function validateConfig(config: SDLCConfig): void {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be an object')
  }

  if (config.language !== undefined && typeof config.language !== 'string') {
    throw new Error('Config field "language" must be a string')
  }

  if (config.tracker !== undefined && typeof config.tracker !== 'string') {
    throw new Error('Config field "tracker" must be a string')
  }

  if (config.repo !== undefined && typeof config.repo !== 'string') {
    throw new Error('Config field "repo" must be a string')
  }
}

/**
 * Get merged config with defaults
 * @param rootDir - Root directory to search for config
 * @returns Merged config with defaults applied
 */
export async function getConfig(rootDir: string = process.cwd()): Promise<SDLCConfig> {
  const config = await loadConfig(rootDir)
  
  return {
    language: getConfigValue(config, 'language', DEFAULT_CONFIG.language!),
    tracker: getConfigValue(config, 'tracker', DEFAULT_CONFIG.tracker!),
    repo: getConfigValue(config, 'repo', undefined),
  }
}

export {SDLCConfig, DEFAULT_CONFIG} from './types'

