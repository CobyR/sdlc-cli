import {describe, it, expect} from 'vitest'
import {getIssueTracker, SupportedTracker} from '../index'
import {GitHubIssuesTracker} from '../github-issues'

describe('Issue Tracker Factory', () => {
  it('should return GitHubIssuesTracker for github', () => {
    const tracker = getIssueTracker('github', 'test/repo')
    expect(tracker).toBeInstanceOf(GitHubIssuesTracker)
  })

  it('should throw error for unsupported tracker', () => {
    expect(() => getIssueTracker('jira' as SupportedTracker, 'test/repo')).toThrow('Unsupported issue tracker: jira')
  })

  it('should accept repo parameter', () => {
    const tracker = getIssueTracker('github', 'custom/repo')
    expect(tracker).toBeInstanceOf(GitHubIssuesTracker)
  })
})
