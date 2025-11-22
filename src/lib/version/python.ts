import {readFile, writeFile} from 'fs/promises'
import {join} from 'path'
import {VersionManager} from './types'

export class PythonVersionManager implements VersionManager {
  private rootDir: string

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir
  }

  async getCurrentVersion(): Promise<string> {
    const pyprojectPath = join(this.rootDir, 'pyproject.toml')
    const content = await readFile(pyprojectPath, 'utf-8')
    const versionMatch = content.match(/version\s*=\s*["']([^"']*)["']/)
    if (!versionMatch) {
      throw new Error('Unable to find version in pyproject.toml')
    }

    return versionMatch[1]
  }

  async updateVersion(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void> {
    // Update pyproject.toml
    await this.updatePyprojectToml(version)

    // Update setup.py
    await this.updateSetupPy(version)

    // Update version_notes.md
    await this.updateVersionNotes(version, releaseDate, releaseNotes, message)

    // Update METADATA
    await this.updateMetadata(releaseDate)
  }

  getVersionFiles(): string[] {
    return ['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA']
  }

  private async updatePyprojectToml(version: string): Promise<void> {
    const pyprojectPath = join(this.rootDir, 'pyproject.toml')
    const content = await readFile(pyprojectPath, 'utf-8')
    const updated = content.replace(/version\s*=\s*["'][^"']*["']/, `version = "${version}"`)
    await writeFile(pyprojectPath, updated, 'utf-8')
  }

  private async updateSetupPy(version: string): Promise<void> {
    const setupPath = join(this.rootDir, 'setup.py')
    try {
      const content = await readFile(setupPath, 'utf-8')
      const updated = content.replace(/version=['"][^'"]*['"]/, `version='${version}'`)
      await writeFile(setupPath, updated, 'utf-8')
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      // setup.py is optional
    }
  }

  private async updateVersionNotes(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void> {
    const notesPath = join(this.rootDir, 'version_notes.md')
    let existingNotes = ''
    try {
      existingNotes = await readFile(notesPath, 'utf-8')
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    const newSection = `## ${version}\nReleased on: ${releaseDate}\n\n${message || ''}\n\n${releaseNotes.map(note => `${note}\n`).join('')}\n\n`
    const updated = newSection + existingNotes
    await writeFile(notesPath, updated, 'utf-8')
  }

  private async updateMetadata(releaseDate: string): Promise<void> {
    const metadataPath = join(this.rootDir, 'METADATA')
    await writeFile(metadataPath, `release_date=${releaseDate}\n`, 'utf-8')
  }
}

