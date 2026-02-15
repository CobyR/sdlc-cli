# Migration Guide: Python to Node.js/TypeScript

This guide helps you migrate from the Python version of SDLC CLI to the new Node.js/TypeScript version.

## Overview

The Node.js/TypeScript version of SDLC CLI provides the same core functionality as the Python version but with improved performance, better integration with modern JavaScript/TypeScript tooling, and a more maintainable codebase.

## Key Differences

### Installation

**Python Version:**
```bash
pip install sdlc-cli
```

**Node.js Version:**
```bash
npm install -g sdlc-cli
```

### Command Structure

The command structure remains largely the same, but there are some minor differences:

**Python Version:**
```bash
sdlc release-helper validate
sdlc work list
```

**Node.js Version:**
```bash
sdlc release-helper validate
sdlc work list
```

Commands are identical, ensuring a smooth migration.

### Configuration File

The configuration file format is the same:

**`.sdlc.json`:**
```json
{
  "language": "python",
  "tracker": "github",
  "repo": "owner/repo-name"
}
```

Both versions use the same JSON format and field names.

## Step-by-Step Migration

### Step 1: Install Node.js Version

1. **Uninstall Python version (optional):**
   ```bash
   pip uninstall sdlc-cli
   ```

2. **Install Node.js version:**
   ```bash
   npm install -g sdlc-cli
   ```

3. **Verify installation:**
   ```bash
   sdlc --version
   ```

### Step 2: Verify Configuration

1. **Check existing config:**
   ```bash
   sdlc config list
   ```

2. **Update if needed:**
   ```bash
   sdlc config set language python  # or nodejs/typescript
   sdlc config set tracker github
   ```

### Step 3: Test Commands

Test your most commonly used commands:

```bash
# Test configuration
sdlc config list

# Test work item listing
sdlc work list

# Test release validation
sdlc release-helper validate
```

### Step 4: Update Scripts and Automation

If you have scripts or CI/CD pipelines using SDLC CLI:

1. **Update installation steps:**
   ```bash
   # Old (Python)
   pip install sdlc-cli
   
   # New (Node.js)
   npm install -g sdlc-cli
   # or for CI/CD
   npm install sdlc-cli
   npx sdlc <command>
   ```

2. **Update CI/CD configurations:**
   - **GitHub Actions:** Update workflow files to install Node.js and npm
   - **GitLab CI:** Update `.gitlab-ci.yml` to use Node.js image
   - **Jenkins:** Update pipeline scripts

### Step 5: Update Documentation

Update any internal documentation that references the Python installation method.

## Feature Parity

### Supported Features

Both versions support:
- ✅ Release workflow management
- ✅ Version bumping (Python, Node.js, TypeScript)
- ✅ GitHub Issues integration
- ✅ Git branch management
- ✅ PR creation and management
- ✅ Work item/issue management
- ✅ Configuration management

### New Features in Node.js Version

The Node.js version includes some enhancements:
- 🆕 Better TypeScript support
- 🆕 Improved error messages
- 🆕 Enhanced GitHub CLI integration
- 🆕 More flexible configuration options
- 🆕 Better cross-platform support

## Command Mapping

All commands work the same way. Here's a quick reference:

| Python Version | Node.js Version | Notes |
|---------------|-----------------|-------|
| `sdlc release-helper validate` | `sdlc release-helper validate` | Identical |
| `sdlc release-helper bump-version` | `sdlc release-helper bump-version` | Identical |
| `sdlc work list` | `sdlc work list` | Identical |
| `sdlc work create` | `sdlc work create` | Identical |
| `sdlc config set` | `sdlc config set` | Identical |

## Troubleshooting Migration

### Command Not Found

**Problem:** `sdlc` command not found after installation.

**Solution:**
1. Verify Node.js installation:
   ```bash
   node --version  # Should be >= 18.0.0
   ```

2. Check npm global bin path:
   ```bash
   npm config get prefix
   ```

3. Add to PATH if needed (see [Troubleshooting Guide](TROUBLESHOOTING.md))

### Configuration Not Found

**Problem:** Existing `.sdlc.json` not being read.

**Solution:**
1. Verify file location (should be in project root)
2. Check JSON syntax:
   ```bash
   sdlc config list
   ```

3. Recreate if needed:
   ```bash
   sdlc config set language python
   sdlc config set tracker github
   ```

### Different Behavior

**Problem:** Commands behave differently than Python version.

**Solution:**
1. Check version:
   ```bash
   sdlc --version
   ```

2. Review [README.md](../README.md) for current behavior
3. Check [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues

## Rollback Plan

If you need to rollback to the Python version:

1. **Uninstall Node.js version:**
   ```bash
   npm uninstall -g sdlc-cli
   ```

2. **Reinstall Python version:**
   ```bash
   pip install sdlc-cli
   ```

3. **Verify configuration:**
   ```bash
   sdlc config list
   ```

## Benefits of Migration

### Performance
- Faster startup time
- Better memory efficiency
- Improved handling of large repositories

### Ecosystem Integration
- Better integration with npm/Node.js projects
- Seamless TypeScript support
- Easier integration with modern JavaScript tooling

### Maintenance
- More active development
- Better long-term support
- Improved code quality and testing

### Developer Experience
- Better error messages
- More intuitive command structure
- Enhanced documentation

## Getting Help

If you encounter issues during migration:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the [README.md](../README.md) for usage examples
3. Check [GitHub Issues](https://github.com/CobyR/sdlc-cli/issues) for known issues
4. Create a new issue with migration-specific problems

## Migration Checklist

- [ ] Install Node.js (>= 18.0.0)
- [ ] Install Node.js version of SDLC CLI
- [ ] Verify `sdlc --version` works
- [ ] Test `sdlc config list`
- [ ] Test `sdlc work list`
- [ ] Test `sdlc release-helper validate`
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Uninstall Python version (optional)
- [ ] Verify all team members have migrated

## Questions?

If you have questions about migration that aren't covered here, please:
1. Check the [Architecture Documentation](ARCHITECTURE.md)
2. Review the [Contributing Guide](CONTRIBUTING.md)
3. Open an issue on GitHub
