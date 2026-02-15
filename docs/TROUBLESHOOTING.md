# Troubleshooting Guide

This guide helps you resolve common issues when using SDLC CLI.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [GitHub Integration Issues](#github-integration-issues)
- [Version Management Issues](#version-management-issues)
- [Git Workflow Issues](#git-workflow-issues)
- [Command-Specific Issues](#command-specific-issues)

## Installation Issues

### Command Not Found

**Problem:** After installing, running `sdlc` gives "command not found" error.

**Solutions:**
1. **Global Installation:**
   ```bash
   npm install -g sdlc-cli
   ```
   Make sure npm global bin directory is in your PATH:
   ```bash
   # Check npm global prefix
   npm config get prefix
   
   # Add to PATH (example for Unix/Mac)
   export PATH=$(npm config get prefix)/bin:$PATH
   ```

2. **Local Installation:**
   Use `npx` to run commands:
   ```bash
   npx sdlc --help
   ```

3. **Verify Installation:**
   ```bash
   npm list -g sdlc-cli
   ```

### TypeScript Build Errors

**Problem:** Build fails with TypeScript errors.

**Solutions:**
1. Ensure you have the correct Node.js version (>= 18.0.0):
   ```bash
   node --version
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Update TypeScript if needed:
   ```bash
   npm install --save-dev typescript@latest
   ```

## Configuration Issues

### Config File Not Found

**Problem:** CLI can't find `.sdlc.json` file.

**Solutions:**
1. Ensure you're running commands from the project root directory
2. Create a config file if needed:
   ```bash
   sdlc config set language nodejs
   sdlc config set tracker github
   ```

3. Check if config file exists:
   ```bash
   ls -la .sdlc.json
   # or on Windows
   dir .sdlc.json
   ```

### Invalid JSON in Config File

**Problem:** Error message about invalid JSON in `.sdlc.json`.

**Solutions:**
1. Validate JSON syntax:
   ```bash
   # Using Node.js
   node -e "JSON.parse(require('fs').readFileSync('.sdlc.json', 'utf8'))"
   ```

2. Use a JSON validator or editor with JSON validation
3. Recreate the config file using CLI commands:
   ```bash
   sdlc config unset language  # Remove problematic keys
   sdlc config set language nodejs  # Set correctly
   ```

### Config Values Not Being Used

**Problem:** Commands ignore config file values.

**Solutions:**
1. Check config precedence: CLI flags override config file
2. Verify config values:
   ```bash
   sdlc config list
   ```

3. Check if you're using flags that override config:
   ```bash
   # This uses config defaults
   sdlc release-helper bump-version --message "Release"
   
   # This overrides config
   sdlc release-helper bump-version --language python --message "Release"
   ```

## GitHub Integration Issues

### GitHub CLI Not Found

**Problem:** Commands fail with "gh: command not found".

**Solutions:**
1. Install GitHub CLI:
   ```bash
   # macOS
   brew install gh
   
   # Windows (using winget)
   winget install GitHub.cli
   
   # Linux
   sudo apt install gh  # Debian/Ubuntu
   sudo dnf install gh  # Fedora
   ```

2. Verify installation:
   ```bash
   gh --version
   ```

3. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

### Authentication Errors

**Problem:** "Authentication failed" or "Not authenticated" errors.

**Solutions:**
1. Check authentication status:
   ```bash
   gh auth status
   ```

2. Re-authenticate:
   ```bash
   gh auth login
   ```

3. Verify repository access:
   ```bash
   gh repo view
   ```

### Repository Not Found

**Problem:** "Repository not found" or "Could not resolve repository".

**Solutions:**
1. Set repository in config:
   ```bash
   sdlc config set repo owner/repo-name
   ```

2. Verify repository format (should be `owner/repo-name`):
   ```bash
   sdlc config get repo
   ```

3. Check if repository exists and you have access:
   ```bash
   gh repo view owner/repo-name
   ```

4. Auto-detect from git remote:
   ```bash
   git remote get-url origin
   # Should be in format: https://github.com/owner/repo.git
   ```

## Version Management Issues

### Version File Not Found

**Problem:** "Could not find version file" error.

**Solutions:**
1. **For Node.js/TypeScript projects:**
   - Ensure `package.json` exists in project root
   - Check that `package.json` has a `version` field

2. **For Python projects:**
   - Ensure `pyproject.toml` or `setup.py` exists
   - Check that version is defined in the appropriate file

3. Verify language setting:
   ```bash
   sdlc config get language
   ```

### Version Bump Fails

**Problem:** Version bump command fails silently or with errors.

**Solutions:**
1. Check file permissions:
   ```bash
   ls -la package.json  # or pyproject.toml
   ```

2. Ensure working tree is clean:
   ```bash
   git status
   ```

3. Try with `--no-commit` flag to debug:
   ```bash
   sdlc release-helper bump-version --message "Test" --no-commit
   ```

4. Check for file locks (Windows) or other processes accessing files

### CHANGELOG Not Updated

**Problem:** Version bumps but CHANGELOG.md is not updated.

**Solutions:**
1. Ensure CHANGELOG.md exists in project root
2. Check file format (should follow standard CHANGELOG format)
3. Verify write permissions on CHANGELOG.md
4. Check if `--no-commit` flag was used (CHANGELOG is updated before commit)

## Git Workflow Issues

### Not on Main Branch Error

**Problem:** "You must not be on main branch" error.

**Solutions:**
1. Check current branch:
   ```bash
   git branch --show-current
   ```

2. Create a feature branch:
   ```bash
   sdlc release-helper start-work
   # or manually
   git checkout -b feature/my-feature
   ```

### Working Tree Not Clean

**Problem:** "Working tree is not clean" error.

**Solutions:**
1. Check git status:
   ```bash
   git status
   ```

2. Commit or stash changes:
   ```bash
   # Option 1: Commit changes
   git add .
   git commit -m "Your message"
   
   # Option 2: Stash changes
   git stash
   ```

3. Discard changes (if safe):
   ```bash
   git checkout .
   ```

### PR Not Found

**Problem:** "PR does not exist for current branch" error.

**Solutions:**
1. Check if PR exists:
   ```bash
   gh pr view
   ```

2. Create a PR:
   ```bash
   sdlc release-helper create-pr
   ```

3. Ensure branch is pushed:
   ```bash
   git push origin $(git branch --show-current)
   ```

### Branch Name Issues

**Problem:** Branch name validation fails or branch creation fails.

**Solutions:**
1. Use `start-work` command for proper branch naming:
   ```bash
   sdlc release-helper start-work --branch-type feature
   ```

2. Ensure branch name follows conventions:
   - `feature/description`
   - `bugfix/description`
   - `hotfix/description`
   - `maintenance/description`

3. Check for special characters or spaces in branch name

## Command-Specific Issues

### `release-helper validate` Fails

**Problem:** Validation fails with unclear error messages.

**Solutions:**
1. Run with verbose output (if available)
2. Check each validation step manually:
   ```bash
   # Check branch
   git branch --show-current
   
   # Check working tree
   git status
   
   # Check PR
   gh pr view
   
   # Check version bump
   git log --oneline -10
   ```

### `bump-version` Doesn't Commit

**Problem:** Version is updated but not committed.

**Solutions:**
1. Check if `--no-commit` flag was used
2. Verify git is properly configured:
   ```bash
   git config user.name
   git config user.email
   ```

3. Check for git hooks that might be blocking commits

### `work list` Shows No Results

**Problem:** Work list command returns empty results.

**Solutions:**
1. Check filters:
   ```bash
   # Try without filters
   sdlc work list --state all
   ```

2. Verify repository configuration:
   ```bash
   sdlc config get repo
   ```

3. Check GitHub authentication:
   ```bash
   gh auth status
   ```

4. Try with different state:
   ```bash
   sdlc work list --state closed
   ```

### `work create` Fails

**Problem:** Cannot create new work items/issues.

**Solutions:**
1. Verify GitHub authentication and permissions
2. Check repository access:
   ```bash
   gh repo view
   ```

3. Ensure required flag is provided:
   ```bash
   sdlc work create --title "Required title"
   ```

4. Check for rate limiting (GitHub API limits)

## General Debugging Tips

1. **Enable Verbose Output:**
   Some commands may support `--verbose` or `-v` flags

2. **Check Logs:**
   Look for error messages in command output

3. **Verify Dependencies:**
   ```bash
   node --version  # Should be >= 18.0.0
   npm --version
   gh --version
   git --version
   ```

4. **Test with Minimal Config:**
   Remove `.sdlc.json` and use CLI flags directly

5. **Check File Permissions:**
   Ensure you have read/write permissions in the project directory

6. **Network Issues:**
   If using GitHub API, check network connectivity and firewall settings

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/CobyR/sdlc-cli/issues) for similar problems
2. Review the [README.md](../README.md) for usage examples
3. Review the [Architecture Documentation](ARCHITECTURE.md) for technical details
4. Create a new issue with:
   - Error messages
   - Command you ran
   - Your environment (OS, Node version, etc.)
   - Steps to reproduce
