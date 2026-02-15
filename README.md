# SDLC CLI

Software Development Life Cycle CLI tool designed to make release tasks easy and consistent across different projects.

## Overview

SDLC CLI is built using [OCLIF (The Open CLI Framework)](https://oclif.io/) and provides a comprehensive set of commands for managing software releases, versioning, and workflow enforcement.

## Features

- **Release Workflow Management**: Enforces proper release workflows and prevents common mistakes
- **Version Management**: Language-specific version bumping (Node.js/TypeScript, Python, and Go support included)
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
  "repo": "owner/repo-name",
  "view": "list"
}
```

**Fields:**
- `language`: Default programming language for version management (default: `"nodejs"`). Supported values: `nodejs`, `typescript`, `python`, `go`
- `tracker`: Default issue tracker to use (default: `"github"`)
- `repo`: Optional GitHub repository identifier in `owner/repo-name` format (auto-detected from git if not provided)
- `view`: Default output format for work list command (default: `"list"`). Supported values: `list`, `table`

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
- `--format`: Output format (list, table) (default: from config or `list`)

The `--format` option allows you to choose between:
- `list`: Traditional list view with full details (default)
- `table`: Compact table view with columns for Status, #, Title, Assignee, and Labels

You can set a default view format in `.sdlc.json` using the `view` field:
```json
{
  "view": "table"
}
```

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

Update work item(s)/issue(s). Supports batch updates by providing multiple issue IDs.

```bash
sdlc work update --id 42 --title "New title"
sdlc work update --id 42 --state closed
sdlc work update --id 42 --assignee username
sdlc work update --id 42 --label "bug" --label "priority:high"
sdlc work update --id 42 --remove-label "bug"
# Batch update multiple issues
sdlc work update --id 1 --id 2 --id 3 --assignee username
sdlc work update --id 1,2,3 --label "in-progress"
```

Options:
- `--id`: Issue ID/number (required, can be used multiple times or comma-separated)
- `--title`: Update issue title
- `--body`: Update issue body/description
- `--state`: Update issue state (open, closed)
- `--assignee`: Update assignee username
- `--label`: Add label (can be used multiple times)
- `--remove-label`: Remove label (can be used multiple times)
- `--tracker`: Issue tracker to use (default: from config or `github`)

At least one update field must be provided. When updating multiple issues, the same updates are applied to all specified issues. Results show success/failure for each issue.

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

## Examples

### Complete Release Workflow

Here's a complete example of using SDLC CLI for a typical release:

```bash
# 1. Start new work on a feature
sdlc release-helper start-work --branch-type feature
# Creates branch: feature/2026-02-15-description

# 2. Create an issue for tracking
sdlc work create --title "Add new authentication feature" --label "enhancement"

# 3. Work on your feature, make commits...

# 4. Bump version when ready to release
sdlc release-helper bump-version --patch --message "Add authentication feature"

# 5. Validate release readiness
sdlc release-helper validate
# Checks: branch, working tree, PR existence, version bump

# 6. Create PR with auto-generated title
sdlc release-helper create-pr

# 7. After PR review, merge and release
sdlc release-helper merge-and-release

# 8. Cleanup fixed issues
sdlc release-helper cleanup
```

### Work Item Management Examples

**List and filter issues:**
```bash
# List all open issues
sdlc work list

# List issues assigned to you
sdlc work list --assignee your-username

# List closed issues with specific label
sdlc work list --state closed --label "bug"

# List issues in table format
sdlc work list --format table

# List issues with multiple labels
sdlc work list --label "bug" --label "priority:high"
```

**Create and manage issues:**
```bash
# Create a simple issue
sdlc work create --title "Fix login bug"

# Create issue with full details
sdlc work create \
  --title "Implement user authentication" \
  --body "Add OAuth2 support for user login" \
  --assignee developer \
  --label "feature" \
  --label "priority:high"

# Get issue details
sdlc work get --id 42

# Update issue
sdlc work update --id 42 --state closed
sdlc work update --id 42 --assignee new-developer
sdlc work update --id 42 --label "in-progress" --remove-label "todo"

# Batch update multiple issues
sdlc work update --id 1,2,3 --label "ready-for-review"
```

**Label management:**
```bash
# List all labels
sdlc work label list

# Get label details
sdlc work label get bug

# Create a new label
sdlc work label create \
  --name "priority:critical" \
  --color "b60205" \
  --description "Critical priority issues"

# Update label
sdlc work label update bug --color "d73a4a" --description "Something isn't working"

# Delete label
sdlc work label delete old-label
```

### Version Management Examples

**Node.js/TypeScript projects:**
```bash
# Patch version bump (1.0.0 -> 1.0.1)
sdlc release-helper bump-version --patch --message "Bug fixes"

# Minor version bump (1.0.0 -> 1.1.0)
sdlc release-helper bump-version --minor --message "New features"

# Major version bump (1.0.0 -> 2.0.0)
sdlc release-helper bump-version --major --message "Breaking changes"

# Specific version
sdlc release-helper bump-version --version 2.5.0 --message "Major release"

# Bump without committing (for review)
sdlc release-helper bump-version --patch --message "Release" --no-commit
```

**Python projects:**
```bash
# Set language in config first
sdlc config set language python

# Then use same commands
sdlc release-helper bump-version --patch --message "Bug fixes"
```

**Go projects:**
```bash
# Set language in config first
sdlc config set language go

# Then use same commands
sdlc release-helper bump-version --patch --message "Bug fixes"
```

Note: Go version manager supports:
- `VERSION` file (primary) - simple text file with version number
- `go.mod` - version comment (e.g., `// version 1.2.3`)
- `CHANGELOG.md` - changelog file

### Configuration Examples

**Setting up a new project:**
```bash
# Initialize configuration
sdlc config set language nodejs
sdlc config set tracker github
sdlc config set repo owner/repo-name
sdlc config set view table

# View configuration
sdlc config list

# Get specific value
sdlc config get language

# Get value with source
sdlc config get language --show-source

# Remove configuration (revert to default)
sdlc config unset repo
```

### Release Helper Examples

**Validation:**
```bash
# Validate current state
sdlc release-helper validate
# Checks:
# - Not on main branch ✓
# - Working tree is clean ✓
# - PR exists ✓
# - Version bump detected ✓
```

**Preview release:**
```bash
# See what issues will be included in release
sdlc release-helper preview
```

**Create PR:**
```bash
# Auto-generate PR title from work items
sdlc release-helper create-pr

# Use custom title
sdlc release-helper create-pr --title "Release v2.0.0"

# Create PR against different base branch
sdlc release-helper create-pr --base develop
```

**Cleanup after release:**
```bash
# Interactive cleanup (asks for confirmation)
sdlc release-helper cleanup

# Force cleanup (no confirmation)
sdlc release-helper cleanup --force

# Cleanup for specific user
sdlc release-helper cleanup --user developer
```

### CI/CD Integration Examples

**GitHub Actions:**
```yaml
name: Release Validation
on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g sdlc-cli
      - run: sdlc release-helper validate
```

**GitLab CI:**
```yaml
validate-release:
  image: node:18
  script:
    - npm install -g sdlc-cli
    - sdlc release-helper validate
  only:
    - merge_requests
```

### Advanced Usage Examples

**Using aliases:**
```bash
# Short aliases for common commands
sdlc w list          # work list
sdlc w:get --id 42   # work get --id 42
sdlc rh validate     # release-helper validate
sdlc c list           # config list
```

**Combining commands:**
```bash
# Create issue and start work in one workflow
ISSUE_ID=$(sdlc work create --title "New feature" | grep -o '#[0-9]*' | cut -c2-)
sdlc release-helper start-work
sdlc work update --id $ISSUE_ID --label "in-progress"
```

**Script automation:**
```bash
#!/bin/bash
# Automated release script

# Validate
sdlc release-helper validate || exit 1

# Bump version
sdlc release-helper bump-version --patch --message "Automated release"

# Create PR
sdlc release-helper create-pr --title "Release $(date +%Y-%m-%d)"
```

## Architecture

### Version Management

Extensible framework for language-specific version management:
- `VersionManager` interface defines the contract
- `NodeVersionManager` implements Node.js/TypeScript project versioning (package.json, CHANGELOG.md)
- `PythonVersionManager` implements Python project versioning (pyproject.toml, setup.py, version_notes.md)
- `GoVersionManager` implements Go project versioning (VERSION, go.mod, CHANGELOG.md)
- Easy to add support for other languages (Rust, etc.)

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

## Documentation

- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Migration Guide](docs/MIGRATION.md) - Migrating from Python version
- [Architecture Documentation](docs/ARCHITECTURE.md) - Technical architecture and design
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute to the project
- [API Documentation](docs/API.md) - Using SDLC CLI as a library

## License

ISC
