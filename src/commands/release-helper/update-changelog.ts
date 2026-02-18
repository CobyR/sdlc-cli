import {Command} from '@oclif/core'
import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'
import {exec} from 'child_process'
import {promisify} from 'util'
import {getVersionManager, SupportedLanguage} from '../../lib/version'
import {getIssueTracker, SupportedTracker} from '../../lib/issue-tracker'
import {getConfig} from '../../lib/config'
import {ALL_VERSION_FILES} from '../../lib/version/constants'

const execAsync = promisify(exec)

const CHANGELOG_FILENAME = 'CHANGELOG.md'

/**
 * Find the current version block (## [version] - ...) and return the content after it.
 * Block ends at the next line matching ## [ or # Changelog.
 * If the version block is not found, returns null (caller should prepend new entry to full content).
 */
function contentAfterVersionBlock(content: string, version: string): string | null {
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

export default class UpdateChangelog extends Command {
  static description = 'Update CHANGELOG.md for the current bumped version (run after bump-version)'

  static aliases = ['rh:update-changelog']

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  async run(): Promise<void> {
    this.log('📝 Updating CHANGELOG for current version...')

    // 1. Version-bump guard: only run if branch has a version-bump commit
    try {
      const {stdout: branchCommits} = await execAsync('git log main..HEAD --oneline --name-only')
      const recentFiles = branchCommits.toLowerCase()
      const versionFilesUpdated = ALL_VERSION_FILES.some(
        file => recentFiles.includes(file.toLowerCase()),
      )
      if (!versionFilesUpdated) {
        this.error(
          'No version bump found on this branch.\n   Run: sdlc release-helper bump-version --message "Your release message" first, then run update-changelog.',
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(`Failed to check branch commits: ${message}`)
    }

    const config = await getConfig()
    const language = (config.language || 'nodejs') as SupportedLanguage
    const tracker = (config.tracker || 'github') as SupportedTracker

    const versionManager = getVersionManager(language)
    const version = await versionManager.getCurrentVersion()

    const issueTracker = getIssueTracker(tracker, config.repo)
    const fixedIssues = await issueTracker.getFixedIssues()
    const releaseNotes = fixedIssues.map(
      issue => `* [${issue.id}](${issue.url || '#'}) - ${issue.title}`,
    )

    const releaseDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    let newEntry = `## [${version}] - ${releaseDate}\n\n`
    if (releaseNotes.length > 0) {
      newEntry += '### Changes\n\n'
      releaseNotes.forEach(note => {
        newEntry += `${note}\n`
      })
      newEntry += '\n'
    }

    const changelogPath = join(process.cwd(), CHANGELOG_FILENAME)
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
    this.log(`✅ CHANGELOG.md updated for version ${version}`)
  }
}
