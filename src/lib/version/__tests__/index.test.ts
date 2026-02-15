import {describe, it, expect} from 'vitest'
import {getVersionManager, SupportedLanguage} from '../index'
import {NodeVersionManager} from '../nodejs'
import {PythonVersionManager} from '../python'
import {GoVersionManager} from '../go'

describe('Version Manager Factory', () => {
  it('should return NodeVersionManager for nodejs', () => {
    const manager = getVersionManager('nodejs')
    expect(manager).toBeInstanceOf(NodeVersionManager)
  })

  it('should return NodeVersionManager for typescript', () => {
    const manager = getVersionManager('typescript')
    expect(manager).toBeInstanceOf(NodeVersionManager)
  })

  it('should return PythonVersionManager for python', () => {
    const manager = getVersionManager('python')
    expect(manager).toBeInstanceOf(PythonVersionManager)
  })

  it('should return GoVersionManager for go', () => {
    const manager = getVersionManager('go')
    expect(manager).toBeInstanceOf(GoVersionManager)
  })

  it('should throw error for unsupported language', () => {
    expect(() => getVersionManager('rust' as SupportedLanguage)).toThrow('Unsupported language: rust')
  })

  it('should accept rootDir parameter', () => {
    const customDir = '/custom/path'
    const manager = getVersionManager('nodejs', customDir)
    expect(manager).toBeInstanceOf(NodeVersionManager)
  })
})
