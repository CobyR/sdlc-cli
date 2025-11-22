export interface SDLCConfig {
  language?: 'python' | string
  tracker?: 'github' | string
  repo?: string
}

export const DEFAULT_CONFIG: SDLCConfig = {
  language: 'python',
  tracker: 'github',
}

