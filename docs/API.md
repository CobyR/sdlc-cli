# API Documentation

This document describes how to use SDLC CLI as a library in your own projects.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Version Management API](#version-management-api)
- [Issue Tracker API](#issue-tracker-api)
- [Configuration API](#configuration-api)
- [Git Utilities API](#git-utilities-api)
- [Examples](#examples)

## Overview

SDLC CLI can be used as a library in addition to being a CLI tool. The core functionality is available through well-defined interfaces and factory functions.

## Installation

Install as a dependency in your project:

```bash
npm install sdlc-cli
```

## Version Management API

### Getting a Version Manager

```typescript
import {getVersionManager, SupportedLanguage} from 'sdlc-cli'

// Get version manager for a specific language
const versionManager = getVersionManager('nodejs', '/path/to/project')
// or
const versionManager = getVersionManager('python', '/path/to/project')
```

**Supported Languages:**
- `'nodejs'` - Node.js/TypeScript projects (uses `package.json`)
- `'typescript'` - Same as `nodejs`
- `'python'` - Python projects (uses `pyproject.toml`)
- `'go'` - Go projects (uses `VERSION` file and `go.mod`)

### VersionManager Interface

```typescript
interface VersionManager {
  /**
   * Get the current version from project files
   * @returns Current version string (e.g., "1.2.3")
   */
  getCurrentVersion(): Promise<string>

  /**
   * Update version in all relevant project files
   * @param version - New version string (e.g., "1.2.4")
   * @param releaseDate - Release date (e.g., "2026-02-15")
   * @param releaseNotes - Array of release note strings
   * @param message - Optional release message
   */
  updateVersion(
    version: string,
    releaseDate: string,
    releaseNotes: string[],
    message?: string
  ): Promise<void>

  /**
   * Get the list of files that need to be updated for a version bump
   * @returns Array of file paths relative to project root
   */
  getVersionFiles(): string[]
}
```

### Example: Version Management

```typescript
import {getVersionManager} from 'sdlc-cli'

async function bumpVersion() {
  const vm = getVersionManager('nodejs', process.cwd())
  
  // Get current version
  const current = await vm.getCurrentVersion()
  console.log(`Current version: ${current}`)
  
  // Calculate next version
  const [major, minor, patch] = current.split('.').map(Number)
  const next = `${major}.${minor}.${patch + 1}`
  
  // Update version
  await vm.updateVersion(
    next,
    new Date().toISOString().split('T')[0],
    ['Fixed bug in authentication', 'Added new feature'],
    'Release v' + next
  )
  
  console.log(`Updated to version: ${next}`)
}
```

## Issue Tracker API

### Getting an Issue Tracker

```typescript
import {getIssueTracker, SupportedTracker} from 'sdlc-cli'

// Get issue tracker (GitHub)
const tracker = getIssueTracker('github', 'owner/repo-name')
// or auto-detect from git
const tracker = getIssueTracker('github')
```

**Supported Trackers:**
- `'github'` - GitHub Issues

### IssueTracker Interface

```typescript
interface IssueTracker {
  /**
   * Get fixed/resolved issues for a user
   * @param user - Optional username to filter by
   * @returns Array of fixed issues
   */
  getFixedIssues(user?: string): Promise<Issue[]>

  /**
   * Close an issue with a release comment
   * @param issue - Issue to close
   * @param version - Version string for the comment
   */
  closeIssue(issue: Issue, version: string): Promise<void>

  /**
   * Get a specific issue by ID
   * @param id - Issue ID/number
   * @returns Issue or null if not found
   */
  getIssueById(id: string): Promise<Issue | null>

  /**
   * List issues with optional filters
   * @param filters - Filter options
   * @returns Array of issues
   */
  listIssues(filters?: IssueFilters): Promise<Issue[]>

  /**
   * Update an issue with new properties
   * @param id - Issue ID
   * @param updates - Update object
   * @returns Updated issue
   */
  updateIssue(id: string, updates: IssueUpdate): Promise<Issue>

  /**
   * Create a new issue
   * @param issue - Issue creation object
   * @returns Created issue
   */
  createIssue(issue: IssueCreate): Promise<Issue>

  /**
   * List all labels in the repository
   * @returns Array of labels
   */
  listLabels(): Promise<Label[]>

  /**
   * Get a specific label by name
   * @param name - Label name
   * @returns Label or null if not found
   */
  getLabel(name: string): Promise<Label | null>

  /**
   * Create a new label
   * @param label - Label object
   * @returns Created label
   */
  createLabel(label: Label): Promise<Label>

  /**
   * Update an existing label
   * @param name - Current label name
   * @param updates - Update object
   * @returns Updated label
   */
  updateLabel(name: string, updates: LabelUpdate): Promise<Label>

  /**
   * Delete a label
   * @param name - Label name to delete
   */
  deleteLabel(name: string): Promise<void>
}
```

### Type Definitions

```typescript
interface Issue {
  id: string
  number?: number
  title: string
  url?: string
  status: string
  assignee?: string
  labels?: string[]
  body?: string
  author?: string
}

interface IssueFilters {
  state?: 'open' | 'closed' | 'all'
  assignee?: string
  author?: string
  labels?: string[]
  limit?: number
}

interface IssueUpdate {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignee?: string
  labels?: string[]
  removeLabels?: string[]
}

interface IssueCreate {
  title: string
  body?: string
  assignee?: string
  labels?: string[]
}

interface Label {
  name: string
  color?: string
  description?: string
}

interface LabelUpdate {
  name?: string
  color?: string
  description?: string
}
```

### Example: Issue Management

```typescript
import {getIssueTracker} from 'sdlc-cli'

async function manageIssues() {
  const tracker = getIssueTracker('github', 'owner/repo')
  
  // List open issues
  const issues = await tracker.listIssues({
    state: 'open',
    limit: 10
  })
  
  // Create a new issue
  const newIssue = await tracker.createIssue({
    title: 'New feature request',
    body: 'Description of the feature',
    labels: ['enhancement']
  })
  
  // Update an issue
  await tracker.updateIssue(newIssue.id, {
    assignee: 'developer',
    labels: ['in-progress']
  })
  
  // Get fixed issues
  const fixedIssues = await tracker.getFixedIssues('developer')
  
  // Close issues for a release
  for (const issue of fixedIssues) {
    await tracker.closeIssue(issue, '1.2.3')
  }
}
```

## Configuration API

### Loading Configuration

```typescript
import {
  loadConfig,
  getConfig,
  saveConfig,
  updateConfigValue,
  SDLCConfig
} from 'sdlc-cli'

// Load config from .sdlc.json
const config = await loadConfig('/path/to/project')
// Returns null if config file doesn't exist

// Get merged config with defaults
const mergedConfig = await getConfig('/path/to/project')
// Always returns a config object with defaults applied

// Save config to file
await saveConfig({
  language: 'nodejs',
  tracker: 'github',
  repo: 'owner/repo'
}, '/path/to/project')

// Update a specific value
await updateConfigValue('language', 'python', '/path/to/project')

// Remove a config value
await updateConfigValue('repo', undefined, '/path/to/project')
```

### Configuration Type

```typescript
interface SDLCConfig {
  language?: 'nodejs' | 'typescript' | 'python' | 'go'
  tracker?: 'github'
  repo?: string  // Format: "owner/repo-name"
  view?: 'list' | 'table'
}
```

### Example: Configuration Management

```typescript
import {getConfig, updateConfigValue} from 'sdlc-cli'

async function setupProject() {
  // Get current config
  const config = await getConfig()
  console.log('Current language:', config.language)
  
  // Update language
  await updateConfigValue('language', 'python')
  
  // Update repository
  await updateConfigValue('repo', 'myorg/myproject')
}
```

## Git Utilities API

### Branch Management

```typescript
import {
  getCurrentBranch,
  isOnMainBranch,
  isWorkingTreeClean,
  createBranch,
  checkoutBranch,
  pullLatest
} from 'sdlc-cli'

// Get current branch
const branch = await getCurrentBranch()

// Check if on main branch
const onMain = await isOnMainBranch()

// Check if working tree is clean
const clean = await isWorkingTreeClean()

// Create and checkout new branch
await createBranch('feature/new-feature')

// Checkout existing branch
await checkoutBranch('main')

// Pull latest changes
await pullLatest('main')
```

### Change Analysis

```typescript
import {
  getChangesSinceMain,
  categorizeChanges,
  FileChange,
  CategorizedChanges
} from 'sdlc-cli'

// Get changes since main branch
const changes: FileChange[] = await getChangesSinceMain()

// Categorize changes
const categorized: CategorizedChanges = categorizeChanges(changes)

// Access categorized changes
console.log('CLI Commands:', categorized['CLI Commands'])
console.log('Library Code:', categorized['Library Code'])
console.log('Documentation:', categorized['Documentation'])
```

### PR Management

```typescript
import {
  prExists,
  createPR,
  mergePR,
  pushBranch
} from 'sdlc-cli'

// Check if PR exists
const exists = await prExists()

// Create a PR
const prUrl = await createPR(
  'PR Title',
  'PR Description',
  'main'  // base branch
)

// Merge PR
await mergePR(true)  // squash merge

// Push branch
await pushBranch('feature/new-feature')
```

### Example: Git Workflow

```typescript
import {
  getCurrentBranch,
  isWorkingTreeClean,
  createBranch,
  pushBranch,
  createPR
} from 'sdlc-cli'

async function startFeature() {
  // Ensure clean working tree
  if (!(await isWorkingTreeClean())) {
    throw new Error('Working tree is not clean')
  }
  
  // Create feature branch
  const branchName = `feature/${Date.now()}`
  await createBranch(branchName)
  
  // ... do work ...
  
  // Push and create PR
  await pushBranch(branchName)
  await createPR(
    'New Feature',
    'Description of the feature',
    'main'
  )
}
```

## Examples

### Complete Release Automation

```typescript
import {
  getVersionManager,
  getIssueTracker,
  getConfig,
  getCurrentBranch,
  isWorkingTreeClean,
  prExists
} from 'sdlc-cli'

async function automateRelease() {
  // Validate state
  if (await isWorkingTreeClean()) {
    throw new Error('Working tree must be clean')
  }
  
  if (await prExists()) {
    throw new Error('PR already exists')
  }
  
  // Get configuration
  const config = await getConfig()
  
  // Get version manager
  const vm = getVersionManager(config.language!)
  const currentVersion = await vm.getCurrentVersion()
  
  // Calculate next version
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  const nextVersion = `${major}.${minor}.${patch + 1}`
  
  // Get fixed issues
  const tracker = getIssueTracker(config.tracker!, config.repo)
  const fixedIssues = await tracker.getFixedIssues()
  
  // Generate release notes
  const releaseNotes = fixedIssues.map(issue => 
    `- ${issue.title} (#${issue.id})`
  )
  
  // Update version
  await vm.updateVersion(
    nextVersion,
    new Date().toISOString().split('T')[0],
    releaseNotes,
    `Release v${nextVersion}`
  )
  
  // Close issues
  for (const issue of fixedIssues) {
    await tracker.closeIssue(issue, nextVersion)
  }
  
  console.log(`Released version ${nextVersion}`)
}
```

### Issue Tracking Integration

```typescript
import {getIssueTracker} from 'sdlc-cli'

async function trackWork() {
  const tracker = getIssueTracker('github', 'owner/repo')
  
  // Get all open issues assigned to me
  const myIssues = await tracker.listIssues({
    state: 'open',
    assignee: 'myusername',
    limit: 50
  })
  
  // Group by label
  const byLabel: Record<string, Issue[]> = {}
  for (const issue of myIssues) {
    for (const label of issue.labels || []) {
      if (!byLabel[label]) {
        byLabel[label] = []
      }
      byLabel[label].push(issue)
    }
  }
  
  // Print summary
  for (const [label, issues] of Object.entries(byLabel)) {
    console.log(`${label}: ${issues.length} issues`)
  }
}
```

### Version Bump Helper

```typescript
import {getVersionManager} from 'sdlc-cli'

async function bumpVersion(
  type: 'major' | 'minor' | 'patch',
  language: 'nodejs' | 'python' | 'go' = 'nodejs'
) {
  const vm = getVersionManager(language)
  const current = await vm.getCurrentVersion()
  const [major, minor, patch] = current.split('.').map(Number)
  
  let next: string
  switch (type) {
    case 'major':
      next = `${major + 1}.0.0`
      break
    case 'minor':
      next = `${major}.${minor + 1}.0`
      break
    case 'patch':
      next = `${major}.${minor}.${patch + 1}`
      break
  }
  
  await vm.updateVersion(
    next,
    new Date().toISOString().split('T')[0],
    [],
    `Bump ${type} version to ${next}`
  )
  
  return next
}
```

## Error Handling

All API functions may throw errors. Always wrap calls in try-catch blocks:

```typescript
import {getVersionManager} from 'sdlc-cli'

try {
  const vm = getVersionManager('nodejs')
  const version = await vm.getCurrentVersion()
  console.log(version)
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message)
  }
}
```

## TypeScript Support

The library is written in TypeScript and includes full type definitions. Import types as needed:

```typescript
import type {
  VersionManager,
  IssueTracker,
  Issue,
  IssueFilters,
  SDLCConfig
} from 'sdlc-cli'
```

## Notes

- All async functions return Promises
- File paths are relative to the project root unless specified
- GitHub CLI (`gh`) must be installed and authenticated for GitHub tracker operations
- Git operations require a git repository in the working directory
