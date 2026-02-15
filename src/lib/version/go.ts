import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'
import {VersionManager} from './types'

export class GoVersionManager implements VersionManager {
  private rootDir: string

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
  }

  async getCurrentVersion(): Promise<string> {
    // Try VERSION file first (most common for Go projects)
    const versionPath = join(this.rootDir, 'VERSION')
    try {
      const content = await readFile(versionPath, 'utf-8')
      const version = content.trim()
      if (version) {
        return version
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // VERSION file doesn't exist, try go.mod
    }

    // Fallback to go.mod (check for version comment or use module path)
    const goModPath = join(this.rootDir, 'go.mod')
    try {
      const content = await readFile(goModPath, 'utf-8')
      
      // Look for version comment: // version 1.2.3
      const versionCommentMatch = content.match(/\/\/\s*version\s+([^\s]+)/i)
      if (versionCommentMatch) {
        return versionCommentMatch[1]
      }
      
      // If no version comment found, throw error
      throw new Error('Unable to find version in VERSION file or go.mod. Please create a VERSION file or add a version comment to go.mod (e.g., // version 1.2.3)')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('Unable to find go.mod file. Please ensure you are in a Go project directory.')
      }
      throw error
    }
  }

  async updateVersion(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void> {
    // Update VERSION file
    await this.updateVersionFile(version)

    // Update go.mod with version comment (if it exists)
    await this.updateGoMod(version)

    // Update CHANGELOG.md
    await this.updateChangelog(version, releaseDate, releaseNotes, message)
  }

  getVersionFiles(): string[] {
    return ['VERSION', 'go.mod', 'CHANGELOG.md']
  }

  private async updateVersionFile(version: string): Promise<void> {
    const versionPath = join(this.rootDir, 'VERSION')
    // Write version as plain text with newline
    await writeFile(versionPath, `${version}\n`, 'utf-8')
  }

  private async updateGoMod(version: string): Promise<void> {
    const goModPath = join(this.rootDir, 'go.mod')
    try {
      const content = await readFile(goModPath, 'utf-8')
      
      // Check if version comment already exists
      if (content.match(/\/\/\s*version\s+/i)) {
        // Update existing version comment
        const updated = content.replace(/\/\/\s*version\s+[^\n]+/i, `// version ${version}`)
        await writeFile(goModPath, updated, 'utf-8')
      } else {
        // Add version comment at the end of the file
        const updated = content.trimEnd() + `\n// version ${version}\n`
        await writeFile(goModPath, updated, 'utf-8')
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // go.mod doesn't exist, that's okay - VERSION file is the primary source
    }
  }

  private async updateChangelog(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void> {
    const changelogPath = join(this.rootDir, 'CHANGELOG.md')
    let existingChangelog = ''
    
    try {
      existingChangelog = await readFile(changelogPath, 'utf-8')
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // CHANGELOG.md doesn't exist, we'll create it
    }

    // Create new changelog entry
    let newEntry = `## [${version}] - ${releaseDate}\n\n`
    
    if (message) {
      newEntry += `${message}\n\n`
    }

    if (releaseNotes.length > 0) {
      newEntry += '### Changes\n\n'
      releaseNotes.forEach(note => {
        newEntry += `${note}\n`
      })
      newEntry += '\n'
    }

    // Prepend new entry to existing changelog
    // If changelog doesn't start with #, add a header
    let updated = newEntry
    if (existingChangelog) {
      if (!existingChangelog.trim().startsWith('#')) {
        updated = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newEntry}${existingChangelog}`
      } else {
        updated = newEntry + existingChangelog
      }
    } else {
      updated = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n${newEntry}`
    }

    await writeFile(changelogPath, updated, 'utf-8')
  }
}
