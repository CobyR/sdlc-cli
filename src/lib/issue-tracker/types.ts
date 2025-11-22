export interface Issue {
  id: string
  number?: number
  title: string
  url?: string
  status: string
  assignee?: string
  labels?: string[]
  body?: string
  author?: string
}

export interface IssueFilters {
  state?: 'open' | 'closed' | 'all'
  assignee?: string
  author?: string
  labels?: string[]
  limit?: number
}

export interface IssueUpdate {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignee?: string
  labels?: string[]
  removeLabels?: string[]
}

export interface IssueCreate {
  title: string
  body?: string
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

  /**
   * List issues with optional filters
   */
  listIssues(filters?: IssueFilters): Promise<Issue[]>

  /**
   * Update an issue with new properties
   */
  updateIssue(id: string, updates: IssueUpdate): Promise<Issue>

  /**
   * Create a new issue
   */
  createIssue(issue: IssueCreate): Promise<Issue>
}

