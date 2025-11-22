import {PythonVersionManager} from './python'
import {VersionManager} from './types'

export type SupportedLanguage = 'python'

export function getVersionManager(language: SupportedLanguage, rootDir?: string): VersionManager {
  switch (language) {
    case 'python':
      return new PythonVersionManager(rootDir)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

export {VersionManager, VersionInfo} from './types'
export {PythonVersionManager} from './python'

