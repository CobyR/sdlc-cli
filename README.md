# SDLC CLI

Software Development Life Cycle CLI tool designed to make release tasks easy and consistent across different projects.

## Overview

SDLC CLI is built using [OCLIF (The Open CLI Framework)](https://oclif.io/) and provides a comprehensive set of commands for managing software releases, versioning, and workflow enforcement.

## Features

- **Release Workflow Management**: Enforces proper release workflows and prevents common mistakes
- **Version Management**: Language-specific version bumping (Node.js/TypeScript and Python support included)
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

## Configuration

SDLC CLI supports project-specific configuration via a `.sdlc.json` file in your project root. This allows you to set default values for commonly used options, reducing the need to specify flags on every command.

### Config File Format

Create a `.sdlc.json` file in your project root:

```json
{
  "language": "nodejs",
  "tracker": "github",
  "repo": "owner/repo-name"
}
```

**Fields:**
- `language`: Default programming language for version management (default: `"nodejs"`). Supported values: `nodejs`, `typescript`, `python`
- `tracker`: Default issue tracker to use (default: `"github"`)
- `repo`: Optional GitHub repository identifier in `owner/repo-name` format (auto-detected from git if not provided)

### Config Precedence

Configuration values are resolved in the following order (highest to lowest priority):
1. **CLI flags** - Explicit flags passed to commands override everything
2. **Config file** - Values from `.sdlc.json`
3. **Defaults** - Built-in default values

### Example Usage

With a config file:
```json
{
  "language": "nodejs",
  "tracker": "github"
}
```

Commands will use these defaults:
```bash
# Uses config defaults (nodejs, github)
sdlc release-helper bump-version --message "Release"

# Overrides config language
sdlc release-helper bump-version --language nodejs --message "Release"

# Overrides config tracker
sdlc release-helper cleanup --tracker jira
```

See `.sdlc.json.example` for a template configuration file.

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
- `--language`: Programming language for version management (default: from config or `nodejs`)
- `--major`, `--minor`, `--patch`: Version numbers
- `--version`: Specific version to set
- `--message`: Release message (required)
- `--no-commit`: Skip automatic commit
- `--tracker`: Issue tracker to use (default: from config or `github`)

#### `cleanup`

Cleanup issues after a release.

```bash
sdlc release-helper cleanup
sdlc release-helper cleanup --force
```

Options:
- `--force`: Skip confirmation
- `--tracker`: Issue tracker to use (default: from config or `github`)
- `--language`: Programming language (default: from config or `nodejs`)
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
- `--tracker`: Issue tracker to use (default: from config or `github`)
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

### `work`

Work item and issue management commands.

#### `list`

List work items/issues with filtering options.

```bash
sdlc work list
sdlc work list --state open
sdlc work list --assignee username --state open
sdlc work list --label "bug" --label "priority:high"
```

Options:
- `--state`: Filter by issue state (open, closed, all) (default: open)
- `--assignee`: Filter by assignee username
- `--author`: Filter by author username
- `--label`: Filter by label (can be used multiple times)
- `--limit`: Maximum number of issues to return (default: 30)
- `--tracker`: Issue tracker to use (default: from config or `github`)

#### `create`

Create a new work item/issue.

```bash
sdlc work create --title "Fix bug in login"
sdlc work create --title "Add feature" --body "Description of the feature"
sdlc work create --title "Bug fix" --assignee username --label "bug"
```

Options:
- `--title`: Issue title (required)
- `--body`: Issue body/description
- `--assignee`: Assign issue to user
- `--label`: Add label (can be used multiple times)
- `--tracker`: Issue tracker to use (default: from config or `github`)

#### `get`

Get detailed information about a specific work item/issue.

```bash
sdlc work get --id 42
```

Options:
- `--id`: Issue ID/number (required)
- `--tracker`: Issue tracker to use (default: from config or `github`)

Displays full issue details including title, status, assignee, labels, author, URL, and body/description.

#### `update`

Update a work item/issue.

```bash
sdlc work update --id 42 --title "New title"
sdlc work update --id 42 --state closed
sdlc work update --id 42 --assignee username
sdlc work update --id 42 --label "bug" --label "priority:high"
sdlc work update --id 42 --remove-label "bug"
```

Options:
- `--id`: Issue ID/number (required)
- `--title`: Update issue title
- `--body`: Update issue body/description
- `--state`: Update issue state (open, closed)
- `--assignee`: Update assignee username
- `--label`: Add label (can be used multiple times)
- `--remove-label`: Remove label (can be used multiple times)
- `--tracker`: Issue tracker to use (default: from config or `github`)

At least one update field must be provided.

#### `label`

Label management commands for repository labels.

##### `list`

List all labels in the repository.

```bash
sdlc work label list
```

Options:
- `--tracker`: Issue tracker to use (default: from config or `github`)

##### `get`

Get details about a specific label.

```bash
sdlc work label get bug
```

Options:
- `name`: Label name (required)
- `--tracker`: Issue tracker to use (default: from config or `github`)

##### `create`

Create a new label.

```bash
sdlc work label create --name "feature" --color "a2eeef"
sdlc work label create --name "bug" --color "d73a4a" --description "Something isn't working"
```

Options:
- `--name`: Label name (required)
- `--color`: Label color (hex code without #)
- `--description`: Label description
- `--tracker`: Issue tracker to use (default: from config or `github`)

##### `update`

Update an existing label.

```bash
sdlc work label update bug --color "d73a4a"
sdlc work label update feature --new-name "enhancement" --description "New feature or request"
```

Options:
- `name`: Label name to update (required)
- `--new-name`: New label name
- `--color`: New label color (hex code without #)
- `--description`: New label description
- `--tracker`: Issue tracker to use (default: from config or `github`)

At least one update field must be provided.

##### `delete`

Delete a label.

```bash
sdlc work label delete bug
```

Options:
- `name`: Label name to delete (required)
- `--tracker`: Issue tracker to use (default: from config or `github`)

**Aliases:**
- `w:label:list`, `w:label:get`, `w:label:create`, `w:label:update`, `w:label:delete`

### `config`

Configuration management commands for `.sdlc.json` file.

#### `list`

List current configuration values with their sources.

```bash
sdlc config list
```

Shows all configuration values and indicates whether they come from the config file, are defaults, or are not set.

#### `get`

Get a specific configuration value.

```bash
sdlc config get language
sdlc config get tracker
sdlc config get repo
sdlc config get language --show-source
```

Options:
- `key`: Configuration key to get (language, tracker, repo) (required)
- `--show-source`: Show where the value comes from (config file, default, etc.)

#### `set`

Set a configuration value.

```bash
sdlc config set language python
sdlc config set tracker github
sdlc config set repo owner/repo-name
```

Options:
- `key`: Configuration key to set (language, tracker, repo) (required)
- `value`: Value to set (required)

Creates or updates the `.sdlc.json` file in the project root.

#### `unset`

Remove a configuration value (revert to default).

```bash
sdlc config unset language
sdlc config unset tracker
sdlc config unset repo
```

Options:
- `key`: Configuration key to remove (language, tracker, repo) (required)

Removes the key from the config file. If the config file becomes empty, it is deleted.

## Architecture

### Version Management

Extensible framework for language-specific version management:
- `VersionManager` interface defines the contract
- `NodeVersionManager` implements Node.js/TypeScript project versioning (package.json, CHANGELOG.md)
- `PythonVersionManager` implements Python project versioning (pyproject.toml, setup.py, version_notes.md)
- Easy to add support for other languages (Go, Rust, etc.)

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
│   │   ├── release-helper/    # Release helper commands
│   │   ├── work/              # Work item management commands
│   │   └── config/            # Configuration management commands
│   ├── lib/
│   │   ├── config/            # Configuration management
│   │   ├── version/           # Version management
│   │   ├── issue-tracker/     # Issue tracker abstraction
│   │   ├── git/               # Git utilities
│   │   └── ai/                # AI integration
│   └── index.ts
├── bin/
│   └── run.js                 # CLI entry point
├── .sdlc.json.example         # Example config file
└── package.json
```

## Requirements

- Node.js >= 18.0.0
- Git
- GitHub CLI (`gh`) for GitHub Issues integration

## License

ISC
