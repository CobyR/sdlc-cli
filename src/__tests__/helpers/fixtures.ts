/**
 * Test data fixtures
 */

export const testPackageJson = {
  name: 'test-project',
  version: '1.0.0',
  description: 'Test project',
}

export const testPyprojectToml = `[project]
name = "test-project"
version = "1.0.0"
description = "Test project"
`

export const testGoMod = `module github.com/test/project

go 1.21
`

export const testChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added
- Initial release
`

export const testSDLCConfig = {
  language: 'nodejs' as const,
  tracker: 'github' as const,
  repo: 'test/repo',
  view: 'list' as const,
}

export const testIssue = {
  id: '42',
  number: 42,
  title: 'Test Issue',
  status: 'open',
  url: 'https://github.com/test/repo/issues/42',
  assignee: 'testuser',
  labels: ['bug'],
  body: 'Test issue description',
  author: 'testuser',
}

export const testIssues = [
  testIssue,
  {
    id: '43',
    number: 43,
    title: 'Another Issue',
    status: 'open',
    url: 'https://github.com/test/repo/issues/43',
    assignee: undefined,
    labels: ['enhancement'],
    body: undefined,
    author: 'testuser',
  },
]
