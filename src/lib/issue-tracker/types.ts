export interface Issue {
  id: string
  number?: number
  title: string
  url?: string
  status: string
  assignee?: string
  labels?: string[]
}

export interface IssueTracker {
  /**
   * Get fixed/resolved issues for a user
   */
  getFixedIssues(user?: string): Promise<Issue[]>

  /**
   * Close an issue with a release comment
   */
  closeIssue(issue: Issue, version: string): Promise<void>

  /**
   * Get a specific issue by ID
   */
  getIssueById(id: string): Promise<Issue | null>
}

