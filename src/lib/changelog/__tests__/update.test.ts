import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {readFile, writeFile, mkdir} from 'fs/promises'
import {join} from 'path'
import {tmpdir} from 'os'
import {
  contentBeforeVersionBlock,
  contentAfterVersionBlock,
  getFirstVersionInChangelog,
  updateChangelogForVersion,
} from '../update'

describe('changelog update', () => {
  describe('getFirstVersionInChangelog', () => {
    it('returns the first version in the changelog', () => {
      const content = `## [0.1.3] - February 20, 2026

### Changes

* [14] - SEO

## [0.1.2] - February 20, 2026

* [11] - Media
`
      expect(getFirstVersionInChangelog(content)).toBe('0.1.3')
    })

    it('returns null when no version block', () => {
      expect(getFirstVersionInChangelog('')).toBeNull()
      expect(getFirstVersionInChangelog('# Changelog\n\nNo versions.')).toBeNull()
    })
  })

  describe('contentBeforeVersionBlock', () => {
    it('returns content before the version block', () => {
      const content = `## [0.1.3] - 2026-02-20

Foo

## [0.1.2] - 2026-02-19

Bar
`
      const before = contentBeforeVersionBlock(content, '0.1.2')
      expect(before).toBeTruthy()
      expect(before).not.toContain('## [0.1.2]')
      expect(before).toContain('## [0.1.3]')
    })

    it('returns null when version not found', () => {
      expect(contentBeforeVersionBlock('## [1.0.0]', '2.0.0')).toBeNull()
    })
  })

  describe('updateChangelogForVersion', () => {
    let tempDir: string

    beforeEach(async () => {
      tempDir = join(tmpdir(), `changelog-update-${Date.now()}`)
      await mkdir(tempDir, {recursive: true})
    })

    afterEach(async () => {
      const {rm} = await import('fs/promises')
      await rm(tempDir, {recursive: true, force: true}).catch(() => {})
    })

    it('preserves version blocks above the updated block', async () => {
      const changelogPath = join(tempDir, 'CHANGELOG.md')
      const existing = `## [0.1.3] - February 20, 2026

Milestone 3

### Changes

* [14](https://example.com/14) - SEO
* [11](https://example.com/11) - Media

## [0.1.2] - February 20, 2026

Milestone 2

### Changes

* [7](https://example.com/7) - Builds API

## [0.1.1] - February 19, 2026

Initial
`
      await writeFile(changelogPath, existing, 'utf-8')

      await updateChangelogForVersion(tempDir, '0.1.2', [
        {id: '7', title: 'Builds API', url: 'https://example.com/7', status: 'open'},
        {id: '8', title: 'Build form', url: 'https://example.com/8', status: 'open'},
      ])

      const result = await readFile(changelogPath, 'utf-8')
      expect(result).toContain('## [0.1.3]')
      expect(result).toContain('Milestone 3')
      expect(result).toContain('[14]')
      expect(result).toContain('## [0.1.2]')
      expect(result).toContain('[7]')
      expect(result).toContain('[8]')
      expect(result).toContain('## [0.1.1]')
      expect(result).toContain('Initial')
    })
  })
})
