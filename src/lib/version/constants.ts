/**
 * Centralized constants for version management
 * 
 * This module provides version file lists and related constants
 * to avoid duplication across the codebase.
 */

/**
 * Version files for Python projects
 * Matches PythonVersionManager.getVersionFiles()
 */
export const PYTHON_VERSION_FILES = [
  'pyproject.toml',
  'setup.py',
  'version_notes.md',
  'METADATA',
] as const

/**
 * Version files for Node.js/TypeScript projects
 * Matches NodeVersionManager.getVersionFiles()
 */
export const NODEJS_VERSION_FILES = [
  'package.json',
  'CHANGELOG.md',
] as const

/**
 * Get all unique version files across all supported languages
 * 
 * This function returns a deduplicated list of all possible version files
 * that might be modified during a version bump. Used for detecting version
 * changes in git commits.
 * 
 * @returns Array of version file names (case-sensitive)
 */
export function getAllVersionFiles(): string[] {
  const allFiles = [
    ...PYTHON_VERSION_FILES,
    ...NODEJS_VERSION_FILES,
  ]
  
  // Remove duplicates and return
  return [...new Set(allFiles)]
}

/**
 * Check if a file is a version file (case-insensitive)
 * 
 * Useful for git commit analysis where file names might have
 * different casing.
 * 
 * @param filename - File name to check
 * @returns True if the file is a version file
 */
export function isVersionFile(filename: string): boolean {
  const normalized = filename.toLowerCase()
  const allFiles = getAllVersionFiles()
  
  return allFiles.some(file => file.toLowerCase() === normalized)
}

