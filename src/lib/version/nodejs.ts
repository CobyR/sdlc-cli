import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'
import {VersionManager} from './types'

export class NodeVersionManager implements VersionManager {
  private rootDir: string

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
  }

  async getCurrentVersion(): Promise<string> {
    const packageJsonPath = join(this.rootDir, 'package.json')
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content)
    
    if (!packageJson.version) {
      throw new Error('Unable to find version in package.json')
    }

    return packageJson.version
  }

  async updateVersion(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void> {
    // Update package.json
    await this.updatePackageJson(version)

    // Update CHANGELOG.md
    await this.updateChangelog(version, releaseDate, releaseNotes, message)
  }

  getVersionFiles(): string[] {
    return ['package.json', 'CHANGELOG.md']
  }

  private async updatePackageJson(version: string): Promise<void> {
    const packageJsonPath = join(this.rootDir, 'package.json')
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content)
    
    packageJson.version = version
    
    // Write back with proper formatting (2 spaces indentation)
    const updated = JSON.stringify(packageJson, null, 2) + '\n'
    await writeFile(packageJsonPath, updated, 'utf-8')
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

