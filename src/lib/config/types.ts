export interface SDLCConfig {
  language?: 'python' | 'nodejs' | 'typescript' | string
  tracker?: 'github' | string
  repo?: string
}

export const DEFAULT_CONFIG: SDLCConfig = {
  language: 'nodejs',
  tracker: 'github',
}

