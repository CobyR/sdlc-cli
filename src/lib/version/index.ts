import {PythonVersionManager} from './python'
import {NodeVersionManager} from './nodejs'
import {VersionManager} from './types'

export type SupportedLanguage = 'python' | 'nodejs' | 'typescript'

export function getVersionManager(language: SupportedLanguage, rootDir?: string): VersionManager {
  switch (language) {
    case 'python':
      return new PythonVersionManager(rootDir)
    case 'nodejs':
    case 'typescript':
      // nodejs and typescript use the same version manager (package.json)
      return new NodeVersionManager(rootDir)
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

export {VersionManager, VersionInfo} from './types'
export {PythonVersionManager} from './python'
export {NodeVersionManager} from './nodejs'

