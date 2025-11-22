import {GitHubIssuesTracker} from './github-issues'
import {IssueTracker} from './types'

export type SupportedTracker = 'github'

export function getIssueTracker(tracker: SupportedTracker, repo?: string): IssueTracker {
  switch (tracker) {
    case 'github':
      return new GitHubIssuesTracker(repo)
    default:
      throw new Error(`Unsupported issue tracker: ${tracker}`)
  }
}

export {IssueTracker, Issue} from './types'
export {GitHubIssuesTracker} from './github-issues'

