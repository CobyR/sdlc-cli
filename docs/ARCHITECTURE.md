# Architecture Documentation

This document describes the architecture and design of SDLC CLI.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Design Patterns](#design-patterns)
- [Extension Points](#extension-points)
- [Data Flow](#data-flow)
- [Dependencies](#dependencies)

## Overview

SDLC CLI is built using [OCLIF (The Open CLI Framework)](https://oclif.io/), which provides a robust foundation for building command-line interfaces. The architecture follows a modular, extensible design that allows for easy addition of new features and integrations.

### Key Design Principles

1. **Modularity**: Code is organized into logical modules with clear responsibilities
2. **Extensibility**: Plugin-based architecture for version managers and issue trackers
3. **Type Safety**: Full TypeScript implementation with comprehensive type definitions
4. **Separation of Concerns**: Clear boundaries between commands, libraries, and utilities
5. **Configuration Management**: Centralized configuration with precedence rules

## Project Structure

```
sdlc-cli/
├── src/
│   ├── commands/           # CLI command implementations
│   │   ├── config/         # Configuration management commands
│   │   ├── release-helper/ # Release workflow commands
│   │   └── work/           # Work item management commands
│   ├── lib/                # Core library code
│   │   ├── ai/            # AI integration (PR title generation)
│   │   ├── config/        # Configuration management
│   │   ├── git/           # Git utilities
│   │   ├── issue-tracker/ # Issue tracker abstraction
│   │   └── version/       # Version management abstraction
│   └── index.ts           # Main entry point
├── bin/
│   └── run.js             # CLI entry point
├── dist/                  # Compiled JavaScript (generated)
└── docs/                  # Documentation
```

## Core Components

### 1. Command Layer (`src/commands/`)

Commands are organized by topic and follow OCLIF conventions. Each command:
- Extends the `Command` class from `@oclif/core`
- Defines flags, arguments, and descriptions
- Implements the `run()` method
- Uses library functions for business logic

**Command Structure:**
```typescript
export default class MyCommand extends Command {
  static description = 'Command description'
  static flags = { /* flag definitions */ }
  
  async run(): Promise<void> {
    const {flags} = await this.parse(MyCommand)
    // Command logic here
  }
}
```

### 2. Version Management (`src/lib/version/`)

**Interface:** `VersionManager`
- Defines contract for language-specific version management
- Methods: `getCurrentVersion()`, `updateVersion()`, `getVersionFiles()`

**Implementations:**
- `NodeVersionManager`: Handles `package.json` and `CHANGELOG.md`
- `PythonVersionManager`: Handles `pyproject.toml`, `setup.py`, `version_notes.md`, `METADATA`

**Factory:** `getVersionManager(language, rootDir)` returns appropriate implementation

**Key Features:**
- Language-agnostic interface
- Automatic file detection and updates
- Release notes generation
- Changelog management

### 3. Issue Tracker Integration (`src/lib/issue-tracker/`)

**Interface:** `IssueTracker`
- Defines contract for issue tracking systems
- Methods for CRUD operations on issues and labels

**Implementations:**
- `GitHubIssuesTracker`: Uses GitHub CLI (`gh`) for GitHub Issues

**Factory:** `getIssueTracker(tracker, repo)` returns appropriate implementation

**Key Features:**
- Tracker-agnostic interface
- Automatic repository detection
- Fallback mechanisms for API failures
- Support for filtering and batch operations

### 4. Configuration Management (`src/lib/config/`)

**Functions:**
- `loadConfig()`: Loads `.sdlc.json` from project root
- `getConfig()`: Returns merged config with defaults
- `saveConfig()`: Saves config to file
- `updateConfigValue()`: Updates specific config values

**Configuration Precedence:**
1. CLI flags (highest priority)
2. Config file (`.sdlc.json`)
3. Defaults (lowest priority)

**Config Structure:**
```typescript
interface SDLCConfig {
  language?: 'nodejs' | 'typescript' | 'python'
  tracker?: 'github'
  repo?: string  // owner/repo-name format
  view?: 'list' | 'table'
}
```

### 5. Git Utilities (`src/lib/git/`)

**Modules:**
- `branch.ts`: Branch management (create, checkout, validation)
- `changes.ts`: Change analysis and categorization
- `pr.ts`: PR creation, validation, and merging

**Key Functions:**
- `getCurrentBranch()`: Get current git branch
- `isOnMainBranch()`: Check if on main/master branch
- `isWorkingTreeClean()`: Check for uncommitted changes
- `getChangesSinceMain()`: Get file changes since main branch
- `categorizeChanges()`: Categorize changes by type
- `prExists()`: Check if PR exists for current branch
- `createPR()`: Create a new PR

### 6. AI Integration (`src/lib/ai/`)

**Module:** `title-generator.ts`
- Generates PR titles based on work items and git changes
- Currently provides simple fallback implementation
- Designed for future AI API integration (Claude, OpenAI, etc.)

## Design Patterns

### 1. Factory Pattern

Used for creating version managers and issue trackers:

```typescript
// Version Manager Factory
export function getVersionManager(language: SupportedLanguage): VersionManager {
  switch (language) {
    case 'python': return new PythonVersionManager()
    case 'nodejs': return new NodeVersionManager()
    // ...
  }
}

// Issue Tracker Factory
export function getIssueTracker(tracker: SupportedTracker): IssueTracker {
  switch (tracker) {
    case 'github': return new GitHubIssuesTracker()
    // ...
  }
}
```

### 2. Strategy Pattern

Version managers and issue trackers implement strategy pattern:
- Common interface defines contract
- Multiple implementations for different languages/trackers
- Runtime selection based on configuration

### 3. Dependency Injection

Configuration and dependencies are injected rather than hardcoded:
- Commands receive config through `getConfig()`
- Trackers receive repo through constructor
- Version managers receive root directory

### 4. Error Handling

Consistent error handling pattern:
- Try-catch blocks around external operations
- Meaningful error messages
- Graceful fallbacks where appropriate
- User-friendly error output

## Extension Points

### Adding a New Language

1. Create new version manager class implementing `VersionManager`:
   ```typescript
   export class GoVersionManager implements VersionManager {
     async getCurrentVersion(): Promise<string> { /* ... */ }
     async updateVersion(...): Promise<void> { /* ... */ }
     getVersionFiles(): string[] { /* ... */ }
   }
   ```

2. Add to factory in `src/lib/version/index.ts`:
   ```typescript
   case 'go': return new GoVersionManager(rootDir)
   ```

3. Update types to include new language:
   ```typescript
   export type SupportedLanguage = 'python' | 'nodejs' | 'typescript' | 'go'
   ```

### Adding a New Issue Tracker

1. Create new tracker class implementing `IssueTracker`:
   ```typescript
   export class JiraTracker implements IssueTracker {
     async listIssues(...): Promise<Issue[]> { /* ... */ }
     // Implement all interface methods
   }
   ```

2. Add to factory in `src/lib/issue-tracker/index.ts`:
   ```typescript
   case 'jira': return new JiraTracker(repo)
   ```

3. Update types to include new tracker:
   ```typescript
   export type SupportedTracker = 'github' | 'jira'
   ```

### Adding a New Command

1. Create command file in appropriate directory:
   ```typescript
   // src/commands/work/archive.ts
   export default class WorkArchive extends Command {
     static description = 'Archive work items'
     // ...
   }
   ```

2. OCLIF automatically discovers commands based on file structure

3. Add to command group index if needed (for nested commands)

## Data Flow

### Command Execution Flow

```
User Input (CLI)
    ↓
OCLIF Command Parser
    ↓
Command.run()
    ↓
Load Config (getConfig)
    ↓
Get Factory Instance (getVersionManager/getIssueTracker)
    ↓
Execute Business Logic
    ↓
Output Results
```

### Configuration Resolution Flow

```
CLI Flags
    ↓ (if not provided)
Config File (.sdlc.json)
    ↓ (if not found)
Default Values
```

### Version Bump Flow

```
bump-version command
    ↓
Get current version (VersionManager.getCurrentVersion)
    ↓
Calculate next version
    ↓
Get fixed issues (IssueTracker.getFixedIssues)
    ↓
Generate release notes
    ↓
Update version files (VersionManager.updateVersion)
    ↓
Commit changes (if not --no-commit)
```

## Dependencies

### Runtime Dependencies

- `@oclif/core`: CLI framework
  - Command parsing and execution
  - Flag and argument handling
  - Help generation

### Development Dependencies

- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `@oclif/plugin-help`: Enhanced help output

### External Tools

- **Git**: Version control operations
- **GitHub CLI (`gh`)**: GitHub Issues integration
  - Required for issue tracker operations
  - Used for PR creation and management

### Node.js Requirements

- Node.js >= 18.0.0
- npm or compatible package manager

## File I/O Patterns

### Reading Configuration

```typescript
// Load config with error handling
const config = await loadConfig(rootDir)
if (!config) {
  // Use defaults
}
```

### Writing Files

```typescript
// Atomic writes with error handling
await writeFile(path, content, 'utf-8')
```

### Git Operations

```typescript
// All git operations use child_process.exec
const {stdout} = await execAsync('git command')
```

## Error Handling Strategy

1. **Validation Errors**: Checked early, clear error messages
2. **External API Errors**: Wrapped with context, fallback where possible
3. **File System Errors**: Checked with appropriate error codes (ENOENT, etc.)
4. **Git Errors**: Caught and handled gracefully, informative messages

## Testing Considerations

While the current codebase doesn't include tests, the architecture supports testing:

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test command execution with mocks
3. **E2E Tests**: Test full workflows with test repositories

Key areas to test:
- Version manager implementations
- Issue tracker implementations
- Configuration management
- Git utilities
- Command logic

## Performance Considerations

1. **Lazy Loading**: Factories create instances only when needed
2. **Caching**: Config is loaded once per command execution
3. **Parallel Operations**: Where possible, operations run in parallel
4. **Minimal Dependencies**: Keep dependency tree small for faster installation

## Security Considerations

1. **Input Validation**: All user inputs are validated
2. **Command Injection**: Git commands use parameterized execution
3. **File Permissions**: Respects file system permissions
4. **Sensitive Data**: No sensitive data stored in config files

## Future Enhancements

Potential architectural improvements:

1. **Plugin System**: Allow external plugins for version managers and trackers
2. **Caching Layer**: Cache GitHub API responses
3. **Batch Operations**: Optimize batch issue updates
4. **Streaming**: Stream large outputs for better performance
5. **Configuration Validation**: Schema validation for config files
6. **Logging**: Structured logging for debugging
