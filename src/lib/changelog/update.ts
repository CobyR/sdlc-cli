import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'
import type {Issue} from '../issue-tracker/types'

export const CHANGELOG_FILENAME = 'CHANGELOG.md'

/**
 * Find the current version block (## [version] - ...) and return the content after it.
 * Block ends at the next line matching ## [ or # Changelog.
 * If the version block is not found, returns null.
 */
export function contentAfterVersionBlock(content: string, version: string): string | null {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const versionHeaderRe = new RegExp(`^## \\[${escaped}\\]`, 'm')
  const nextSectionRe = /^## \[|^# Changelog/m

  const match = content.match(versionHeaderRe)
  if (!match || match.index === undefined) {
    return null
  }

  const blockStart = match.index
  const afterHeader = content.slice(blockStart + match[0].length)
  const nextMatch = afterHeader.match(nextSectionRe)
  const blockEnd = nextMatch
    ? blockStart + match[0].length + nextMatch.index!
    : content.length
  return content.slice(blockEnd).replace(/^\s*\n+/, '\n\n')
}

/**
 * Extract the version block (from ## [version] to next ## [ or # Changelog).
 * Returns the block content including the header, or null if not found.
 */
export function extractVersionBlock(content: string, version: string): string | null {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const versionHeaderRe = new RegExp(`^## \\[${escaped}\\]`, 'm')
  const nextSectionRe = /^## \[|^# Changelog/m

  const match = content.match(versionHeaderRe)
  if (!match || match.index === undefined) {
    return null
  }

  const blockStart = match.index
  const afterHeader = content.slice(blockStart + match[0].length)
  const nextMatch = afterHeader.match(nextSectionRe)
  const blockEnd = nextMatch
    ? blockStart + match[0].length + nextMatch.index!
    : content.length
  return content.slice(blockStart, blockEnd)
}

/**
 * Count bullet points under ### Changes in a version block.
 * Matches lines like "* [id](url) - title".
 */
export function countChangesInVersionBlock(versionBlock: string): number {
  const changesHeader = '### Changes'
  const idx = versionBlock.indexOf(changesHeader)
  if (idx === -1) return 0
  const afterHeader = versionBlock.slice(idx + changesHeader.length)
  const lines = afterHeader.split('\n')
  let count = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('* [') && trimmed.includes('](')) {
      count++
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# Changelog')) {
      break
    }
  }
  return count
}

/**
 * Build the new changelog entry text for a version.
 */
export function buildChangelogEntry(
  version: string,
  releaseDate: string,
  fixedIssues: Issue[],
): string {
  const releaseNotes = fixedIssues.map(
    issue => `* [${issue.id}](${issue.url || '#'}) - ${issue.title}`,
  )
  let newEntry = `## [${version}] - ${releaseDate}\n\n`
  if (releaseNotes.length > 0) {
    newEntry += '### Changes\n\n'
    releaseNotes.forEach(note => {
      newEntry += `${note}\n`
    })
    newEntry += '\n'
  }
  return newEntry
}

/**
 * Update CHANGELOG.md for the given version: remove existing entry for that version,
 * then write new entry built from fixed issues. Uses rootDir for CHANGELOG path.
 */
export async function updateChangelogForVersion(
  rootDir: string,
  version: string,
  fixedIssues: Issue[],
): Promise<void> {
  const releaseDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const newEntry = buildChangelogEntry(version, releaseDate, fixedIssues)
  const changelogPath = join(rootDir, CHANGELOG_FILENAME)
  let existingChangelog: string
  try {
    existingChangelog = await readFile(changelogPath, 'utf-8')
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      existingChangelog = ''
    } else {
      throw error
    }
  }
  const afterBlock = contentAfterVersionBlock(existingChangelog, version)
  const updated =
    afterBlock !== null
      ? newEntry + afterBlock
      : newEntry + (existingChangelog ? `\n\n${existingChangelog}` : '')
  await writeFile(changelogPath, updated, 'utf-8')
}
