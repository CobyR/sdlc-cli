# Implement SDLC CLI with OCLIF

## Overview
Build a new OCLIF-based CLI tool in the `sdlc-cli` submodule with a `release-helper` command set. The tool will support language-specific version management, issue tracker abstraction, and GitHub Issues integration.

## Project Structure

```
sdlc-cli/
├── src/
│   ├── commands/
│   │   └── release-helper/
│   │       ├── index.ts                    # Command group entry point
│   │       ├── validate.ts                 # Validate release readiness
│   │       ├── bump-version.ts             # Version bumping with language support
│   │       ├── cleanup.ts                  # Close issues after release
│   │       ├── create-pr.ts                # Create PR with AI title generation
│   │       ├── merge-and-release.ts        # Merge PR and execute release
│   │       ├── preview.ts                  # Preview issues for release
│   │       └── start-work.ts               # Create new development branch
│   ├── lib/
│   │   ├── version/
│   │   │   ├── index.ts                    # Version manager interface
│   │   │   ├── python.ts                   # Python version manager
│   │   │   └── types.ts                    # Version manager types
│   │   ├── issue-tracker/
│   │   │   ├── index.ts                    # Issue tracker interface
│   │   │   ├── github-issues.ts            # GitHub Issues implementation
│   │   │   └── types.ts                    # Issue tracker types
│   │   ├── git/
│   │   │   ├── branch.ts                   # Branch management utilities
│   │   │   ├── changes.ts                  # Git change analysis
│   │   │   └── pr.ts                       # PR creation utilities
│   │   └── ai/
│   │       └── title-generator.ts           # AI-powered PR title generation
│   ├── bin/
│   │   └── run.ts                          # CLI entry point
│   └── index.ts                            # Main export
├── package.json                            # OCLIF project configuration
├── tsconfig.json                           # TypeScript configuration
└── README.md                                # Updated documentation
```

## Implementation Steps

### Step 1: Initialize OCLIF Project
- Create `package.json` with OCLIF dependencies
- Set up TypeScript configuration
- Create basic OCLIF command structure
- Configure bin entry point

### Step 2: Create Version Management Framework
- Define `VersionManager` interface in `src/lib/version/types.ts`
- Implement `PythonVersionManager` in `src/lib/version/python.ts`:
  - Read version from `pyproject.toml`
  - Update `pyproject.toml`, `setup.py`, `version_notes.md`, `METADATA`
  - Generate release notes from fixed work items
  - Auto-commit version changes
- Create version manager factory in `src/lib/version/index.ts`

### Step 3: Create Issue Tracker Abstraction
- Define `IssueTracker` interface in `src/lib/issue-tracker/types.ts`:
  - `getFixedIssues(user)`: Get fixed issues for user
  - `closeIssue(issue, version)`: Close issue with release comment
  - `getIssueById(id)`: Get specific issue
- Implement `GitHubIssuesTracker` in `src/lib/issue-tracker/github-issues.ts`:
  - Use GitHub CLI (`gh`) for operations
  - Query issues with status filters
  - Add comments and update issue status
  - Support GitHub API as fallback
- Create issue tracker factory in `src/lib/issue-tracker/index.ts`

### Step 4: Implement Git Utilities
- `src/lib/git/branch.ts`: Branch validation, creation, checking
- `src/lib/git/changes.ts`: Analyze git changes by file type/category
- `src/lib/git/pr.ts`: PR creation, validation, merging utilities

### Step 5: Implement Release Helper Commands

#### validate.ts
- Check current branch (not main)
- Verify working tree is clean
- Check PR exists for branch
- Verify version bump in recent commits
- Return validation status

#### bump-version.ts
- Accept `--language` option (default: python)
- Use appropriate VersionManager based on language
- Gather fixed issues from IssueTracker
- Generate release notes
- Update version files
- Auto-commit changes (unless `--no-commit`)

#### cleanup.ts
- Accept `--tracker` option (default: github)
- Use appropriate IssueTracker
- Get fixed issues for current user
- Close issues with release version comment
- Support `--force` flag to skip confirmation

#### preview.ts
- Accept `--tracker` option (default: github)
- Use appropriate IssueTracker
- Display fixed issues that would be included
- Show preview of next version

#### create-pr.ts
- Generate PR title (AI-powered or manual)
- Analyze git changes by category
- Generate comprehensive PR description
- Push branch and create PR

#### merge-and-release.ts
- Validate release readiness
- Merge PR (squash merge)
- Switch to main and pull
- Run cleanup to close issues
- Install new version (if applicable)

#### start-work.ts
- Validate on main branch
- Check working tree clean
- Pull latest from main
- Optionally create work item first
- Create feature branch
- Provide next steps guidance

### Step 6: AI Integration (Optional Enhancement)
- Create `src/lib/ai/title-generator.ts`
- Integrate with Anthropic Claude API (or similar)
- Generate PR titles based on work items and changes
- Fallback to manual title if AI unavailable

## Key Design Decisions

1. **Language Support**: Extensible framework - add new language managers by implementing `VersionManager` interface
2. **Issue Tracker Support**: Plugin architecture - add new trackers by implementing `IssueTracker` interface
3. **GitHub Integration**: Primary use of `gh` CLI, with API fallback
4. **Error Handling**: Comprehensive validation at each step with clear error messages
5. **Workflow Enforcement**: Prevents common mistakes (committing to main, skipping PRs, etc.)

## Dependencies

- `@oclif/core`: OCLIF framework
- `@oclif/plugin-help`: Help system
- `typescript`: TypeScript support
- `ts-node`: TypeScript execution
- `gh` CLI: GitHub operations (external dependency)
- Optional: Anthropic SDK for AI features

## Testing Strategy

- Unit tests for version managers
- Unit tests for issue tracker implementations
- Integration tests for git operations
- E2E tests for complete workflows

## Reference Implementation

This plan is based on the Python implementation in `release-helper.py` which provides:
- Release workflow enforcement and validation
- Version management and bumping
- Work item lifecycle management
- AI-powered PR title generation
- Documentation generation and validation
- Release cleanup and work item closure
- Branch management and PR creation

## Migration Notes

Key differences from Python implementation:
- TypeScript/Node.js instead of Python
- OCLIF framework instead of Click
- GitHub Issues instead of GUS (Salesforce work items)
- Extensible language and tracker support from the start
- Modern async/await patterns throughout

