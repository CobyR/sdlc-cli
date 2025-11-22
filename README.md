# SDLC CLI

Software Development Life Cycle CLI tool designed to make release tasks easy and consistent across different projects.

## Overview

SDLC CLI is built using [OCLIF (The Open CLI Framework)](https://oclif.io/) and provides a comprehensive set of commands for managing software releases, versioning, and workflow enforcement.

## Features

- **Release Workflow Management**: Enforces proper release workflows and prevents common mistakes
- **Version Management**: Language-specific version bumping (Python support included)
- **Issue Tracker Integration**: Extensible framework for different issue tracking systems (GitHub Issues implemented)
- **Git Integration**: Branch management, change analysis, and PR creation
- **Workflow Enforcement**: Prevents commits to main branch, ensures PRs exist, validates version bumps

## Installation

```bash
npm install -g sdlc-cli
```

Or use locally in a project:

```bash
npm install sdlc-cli
npx sdlc release-helper validate
```

## Commands

### `release-helper`

Main command group for release workflow management.

#### `validate`

Validate current state for release readiness.

```bash
sdlc release-helper validate
```

Checks:
- Not on main branch
- Working tree is clean
- PR exists for current branch
- Version bump detected in recent commits

#### `bump-version`

Version bump to prepare for a release.

```bash
sdlc release-helper bump-version --message "Release message"
sdlc release-helper bump-version --language python --major 2 --minor 0 --patch 0 --message "Major release"
```

Options:
- `--language` (default: python): Programming language for version management
- `--major`, `--minor`, `--patch`: Version numbers
- `--version`: Specific version to set
- `--message`: Release message (required)
- `--no-commit`: Skip automatic commit
- `--tracker`: Issue tracker to use (default: github)

#### `cleanup`

Cleanup issues after a release.

```bash
sdlc release-helper cleanup
sdlc release-helper cleanup --force
```

Options:
- `--force`: Skip confirmation
- `--tracker`: Issue tracker to use (default: github)
- `--language`: Programming language (default: python)
- `--user`: User to cleanup issues for

#### `preview`

Preview fixed issues for upcoming release.

```bash
sdlc release-helper preview
```

#### `create-pr`

Create PR for current branch.

```bash
sdlc release-helper create-pr
sdlc release-helper create-pr --title "My Release"
```

Options:
- `--title`: PR title (if not provided, will be generated)
- `--tracker`: Issue tracker to use (default: github)
- `--base`: Base branch for PR (default: main)

#### `merge-and-release`

Merge PR and execute release process.

```bash
sdlc release-helper merge-and-release
```

#### `start-work`

Safely start new development work with proper branch setup.

```bash
sdlc release-helper start-work
sdlc release-helper start-work --branch-type feature
```

Options:
- `--branch-type`: Type of branch to create (feature, bugfix, hotfix, maintenance)

## Architecture

### Version Management

Extensible framework for language-specific version management:
- `VersionManager` interface defines the contract
- `PythonVersionManager` implements Python project versioning
- Easy to add support for other languages (Node.js, Go, etc.)

### Issue Tracker Integration

Plugin architecture for issue tracking systems:
- `IssueTracker` interface defines the contract
- `GitHubIssuesTracker` implements GitHub Issues integration
- Easy to add support for other trackers (Jira, Linear, etc.)

### Git Utilities

Comprehensive git operations:
- Branch validation and management
- Change analysis and categorization
- PR creation and merging

## Development

### Setup

```bash
npm install
npm run build
```

### Project Structure

```
sdlc-cli/
├── src/
│   ├── commands/
│   │   └── release-helper/    # Release helper commands
│   ├── lib/
│   │   ├── version/           # Version management
│   │   ├── issue-tracker/     # Issue tracker abstraction
│   │   ├── git/               # Git utilities
│   │   └── ai/                # AI integration
│   └── index.ts
├── bin/
│   └── run.js                 # CLI entry point
└── package.json
```

## Requirements

- Node.js >= 18.0.0
- Git
- GitHub CLI (`gh`) for GitHub Issues integration

## License

ISC
