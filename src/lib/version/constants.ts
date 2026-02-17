/**
 * Centralized constants for version file management
 */

/**
 * Version files by language
 */
export const VERSION_FILES = {
  nodejs: ['package.json', 'CHANGELOG.md'],
  typescript: ['package.json', 'CHANGELOG.md'],
  python: ['pyproject.toml', 'setup.py', 'version_notes.md', 'METADATA'],
  go: ['VERSION', 'go.mod', 'CHANGELOG.md'],
} as const

/**
 * All version files across all languages (case-insensitive for matching)
 * Used for detecting version bumps in git commits
 */
export const ALL_VERSION_FILES = [
  'package.json',
  'CHANGELOG.md',
  'changelog.md', // lowercase variant
  'pyproject.toml',
  'setup.py',
  'version_notes.md',
  'METADATA',
  'metadata', // lowercase variant
  'VERSION',
  'go.mod',
] as const

/**
 * Get all version files for a specific language
 */
export function getVersionFilesForLanguage(language: keyof typeof VERSION_FILES): readonly string[] {
  return VERSION_FILES[language] || []
}

/**
 * Check if a file is a version file (case-insensitive)
 */
export function isVersionFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase()
  return ALL_VERSION_FILES.some(file => file.toLowerCase() === lowerFilename)
}
