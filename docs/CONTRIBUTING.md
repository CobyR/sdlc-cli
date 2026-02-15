# Contributing Guide

Thank you for your interest in contributing to SDLC CLI! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and considerate in all interactions. We aim to create a welcoming environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sdlc-cli.git
   cd sdlc-cli
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/CobyR/sdlc-cli.git
   ```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)
- Git
- GitHub CLI (`gh`) - for testing GitHub integration

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Link for local development:**
   ```bash
   npm link
   ```

   This allows you to use `sdlc` command from your local development version.

4. **Verify installation:**
   ```bash
   sdlc --version
   ```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-bugfix-name
   ```

2. **Make your changes**

3. **Build and test:**
   ```bash
   npm run build
   ```

4. **Test your changes:**
   ```bash
   # Test a specific command
   node bin/run.js <command>
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

## Making Changes

### Project Structure

- `src/commands/`: CLI command implementations
- `src/lib/`: Core library code
- `bin/run.js`: CLI entry point
- `docs/`: Documentation files

### Adding a New Command

1. Create a new file in the appropriate command directory:
   ```typescript
   // src/commands/work/archive.ts
   import {Command, Flags} from '@oclif/core'
   
   export default class WorkArchive extends Command {
     static description = 'Archive work items'
     
     static flags = {
       id: Flags.string({
         description: 'Issue ID',
         required: true,
       }),
     }
     
     async run(): Promise<void> {
       const {flags} = await this.parse(WorkArchive)
       // Your implementation
     }
   }
   ```

2. OCLIF will automatically discover the command based on file structure

3. Test your command:
   ```bash
   npm run build
   node bin/run.js work archive --id 42
   ```

### Adding a New Version Manager

1. Create a new version manager class:
   ```typescript
   // src/lib/version/go.ts
   import {VersionManager} from './types'
   
   export class GoVersionManager implements VersionManager {
     async getCurrentVersion(): Promise<string> {
       // Implementation
     }
     
     async updateVersion(...): Promise<void> {
       // Implementation
     }
     
     getVersionFiles(): string[] {
       return ['go.mod', 'CHANGELOG.md']
     }
   }
   ```

2. Add to factory in `src/lib/version/index.ts`:
   ```typescript
   case 'go': return new GoVersionManager(rootDir)
   ```

3. Update type definitions:
   ```typescript
   export type SupportedLanguage = 'python' | 'nodejs' | 'typescript' | 'go'
   ```

### Adding a New Issue Tracker

1. Create a new tracker class:
   ```typescript
   // src/lib/issue-tracker/jira.ts
   import {IssueTracker} from './types'
   
   export class JiraTracker implements IssueTracker {
     // Implement all interface methods
   }
   ```

2. Add to factory in `src/lib/issue-tracker/index.ts`

3. Update type definitions

## Submitting Changes

### Before Submitting

1. **Ensure code builds:**
   ```bash
   npm run build
   ```

2. **Check for linting errors** (if linter is configured)

3. **Update documentation** if you've added features or changed behavior

4. **Test your changes** thoroughly

### Pull Request Process

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub

3. **Fill out the PR template:**
   - Describe your changes
   - Reference any related issues
   - Include testing instructions

4. **Respond to feedback** and make requested changes

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(version): add Go version manager support

docs: update README with new examples

fix(work): handle missing assignee in list command
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for public APIs
- Use explicit return types for public methods
- Avoid `any` type; use `unknown` if type is truly unknown

### Naming Conventions

- **Files**: kebab-case (e.g., `version-manager.ts`)
- **Classes**: PascalCase (e.g., `VersionManager`)
- **Functions/Variables**: camelCase (e.g., `getCurrentVersion`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_CONFIG`)

### Code Organization

- One class/interface per file
- Group related functions in modules
- Use clear, descriptive names
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Gets the current version from project files
 * @param rootDir - Root directory of the project
 * @returns Current version string
 * @throws Error if version cannot be determined
 */
export async function getCurrentVersion(rootDir: string): Promise<string> {
  // Implementation
}
```

## Testing

While the project doesn't currently have automated tests, consider:

1. **Manual Testing:**
   - Test commands with various inputs
   - Test error cases
   - Test edge cases

2. **Integration Testing:**
   - Test with real GitHub repositories
   - Test with different project types (Node.js, Python)

3. **Future Test Setup:**
   - Unit tests with Jest or similar
   - Integration tests with test repositories
   - Mock external dependencies

## Documentation

### Code Documentation

- Add JSDoc comments for public functions and classes
- Document parameters and return values
- Include examples for complex functions

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Update command help text

### Architecture Documentation

- Update ARCHITECTURE.md for significant architectural changes
- Document new extension points
- Update data flow diagrams if needed

## Review Process

1. **Automated Checks:**
   - Build must pass
   - No TypeScript errors
   - Code must follow style guidelines

2. **Code Review:**
   - At least one maintainer will review
   - Address all feedback
   - Be open to suggestions

3. **Merge:**
   - Maintainers will merge after approval
   - PRs may be squashed on merge

## Getting Help

- **Questions?** Open a discussion on GitHub
- **Found a bug?** Open an issue
- **Need clarification?** Comment on the relevant issue or PR

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md (if maintained)
- Credited in release notes
- Acknowledged in PRs and issues

Thank you for contributing to SDLC CLI! 🎉
