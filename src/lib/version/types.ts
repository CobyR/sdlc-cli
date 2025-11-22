export interface VersionInfo {
  current: string
  next: string
  releaseDate: string
  releaseNotes: string[]
  message?: string
}

export interface VersionManager {
  /**
   * Get the current version from project files
   */
  getCurrentVersion(): Promise<string>

  /**
   * Update version in all relevant project files
   */
  updateVersion(version: string, releaseDate: string, releaseNotes: string[], message?: string): Promise<void>

  /**
   * Get the list of files that need to be updated for a version bump
   */
  getVersionFiles(): string[]
}

