import {describe, it, expect, beforeEach, vi} from 'vitest'
import {getChangesSinceMain, categorizeChanges, FileChange} from '../changes'
import {exec} from 'child_process'

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  default: {
    exec: vi.fn(),
  },
}))

describe('Git Changes Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getChangesSinceMain', () => {
    it('should parse git diff output correctly', async () => {
      const gitDiffOutput = `A\tnew-file.ts
M\tmodified-file.ts
D\tdeleted-file.ts
`
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: gitDiffOutput, stderr: ''})
        }) as any
      )

      const changes = await getChangesSinceMain()

      expect(changes).toHaveLength(3)
      expect(changes[0]).toEqual({status: 'A', path: 'new-file.ts'})
      expect(changes[1]).toEqual({status: 'M', path: 'modified-file.ts'})
      expect(changes[2]).toEqual({status: 'D', path: 'deleted-file.ts'})
    })

    it('should return empty array on error', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('error'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const changes = await getChangesSinceMain()

      expect(changes).toEqual([])
    })

    it('should handle empty diff output', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const changes = await getChangesSinceMain()

      expect(changes).toEqual([])
    })
  })

  describe('categorizeChanges', () => {
    it('should categorize changes by file type', () => {
      const changes: FileChange[] = [
        {status: 'A', path: 'src/commands/test.ts'},
        {status: 'M', path: 'src/lib/utils.ts'},
        {status: 'A', path: 'docs/README.md'},
        {status: 'D', path: 'test/file.spec.ts'},
      ]

      const categorized = categorizeChanges(changes)

      expect(categorized['CLI Commands']).toBeDefined()
      expect(categorized['CLI Commands'].added).toContain('src/commands/test.ts')
      expect(categorized['Library Code']).toBeDefined()
      expect(categorized['Library Code'].modified).toContain('src/lib/utils.ts')
      expect(categorized['Documentation']).toBeDefined()
      expect(categorized['Documentation'].added).toContain('docs/README.md')
      expect(categorized['Tests']).toBeDefined()
      expect(categorized['Tests'].deleted).toContain('test/file.spec.ts')
    })

    it('should handle empty changes array', () => {
      const categorized = categorizeChanges([])

      expect(Object.keys(categorized)).toHaveLength(0)
    })

    it('should categorize version files correctly', () => {
      const changes: FileChange[] = [
        {status: 'M', path: 'CHANGELOG.md'},
      ]

      const categorized = categorizeChanges(changes)

      expect(categorized['Version Management']).toBeDefined()
      expect(categorized['Version Management'].modified).toContain('CHANGELOG.md')
    })

    it('should categorize config files correctly', () => {
      const changes: FileChange[] = [
        {status: 'M', path: 'package.json'},
        {status: 'A', path: 'tsconfig.json'},
      ]

      const categorized = categorizeChanges(changes)

      expect(categorized['Configuration']).toBeDefined()
      expect(categorized['Configuration'].added).toContain('tsconfig.json')
    })
  })
})
