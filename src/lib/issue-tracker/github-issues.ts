import {exec} from 'child_process'
import {promisify} from 'util'
import {Issue, IssueTracker, IssueFilters, IssueUpdate, IssueCreate} from './types'

const execAsync = promisify(exec)

export class GitHubIssuesTracker implements IssueTracker {
  private repo: string

  constructor(repo?: string) {
    this.repo = repo || this.getRepoFromGit()
  }

  async getFixedIssues(user?: string): Promise<Issue[]> {
    try {
      // Use gh CLI to get issues
      let query = 'is:issue is:closed'
      if (user) {
        query += ` assignee:${user}`
      }

      const {stdout} = await execAsync(`gh issue list --repo ${this.repo} --state closed --json number,title,url,state,assignees,labels --limit 100`)
      const issues = JSON.parse(stdout)

      return issues
        .filter((issue: any) => {
          // Filter for issues that are closed but not yet released
          // In GitHub, we'll look for issues with "Fixed" label or similar
          const hasFixedLabel = issue.labels?.some((label: any) => 
            label.name.toLowerCase().includes('fixed') || 
            label.name.toLowerCase().includes('resolved')
          )
          return hasFixedLabel || issue.state === 'closed'
        })
        .map((issue: any) => ({
          id: issue.number.toString(),
          number: issue.number,
          title: issue.title,
          url: issue.url,
          status: issue.state,
          assignee: issue.assignees?.[0]?.login,
          labels: issue.labels?.map((l: any) => l.name) || [],
        }))
    } catch (error: any) {
      // Fallback to GitHub API if gh CLI fails
      return this.getFixedIssuesFromAPI(user)
    }
  }

  async closeIssue(issue: Issue, version: string): Promise<void> {
    try {
      const comment = `Shipped with Release '${version}'`
      await execAsync(`gh issue comment ${issue.number || issue.id} --repo ${this.repo} --body "${comment}"`)
      
      // Add a label or update status if needed
      // GitHub issues don't have a separate "shipped" state, so we'll just add a comment
    } catch (error: any) {
      throw new Error(`Failed to close issue ${issue.id}: ${error.message}`)
    }
  }

  async getIssueById(id: string): Promise<Issue | null> {
    try {
      const {stdout} = await execAsync(`gh issue view ${id} --repo ${this.repo} --json number,title,url,state,assignees,labels,body,author`)
      const issue = JSON.parse(stdout)
      
      return {
        id: issue.number.toString(),
        number: issue.number,
        title: issue.title,
        url: issue.url,
        status: issue.state,
        assignee: issue.assignees?.[0]?.login,
        labels: issue.labels?.map((l: any) => l.name) || [],
        body: issue.body || undefined,
        author: issue.author?.login || undefined,
      }
    } catch (error: any) {
      return null
    }
  }

  async listIssues(filters?: IssueFilters): Promise<Issue[]> {
    try {
      const state = filters?.state || 'open'
      const limit = filters?.limit || 30
      
      let command = `gh issue list --repo ${this.repo} --state ${state} --json number,title,url,state,assignees,labels,author --limit ${limit}`
      
      if (filters?.assignee) {
        command += ` --assignee ${filters.assignee}`
      }
      
      if (filters?.author) {
        command += ` --author ${filters.author}`
      }
      
      if (filters?.labels && filters.labels.length > 0) {
        command += ` --label "${filters.labels.join(',')}"`
      }

      const {stdout} = await execAsync(command)
      const issues = JSON.parse(stdout)

      return issues.map((issue: any) => ({
        id: issue.number.toString(),
        number: issue.number,
        title: issue.title,
        url: issue.url,
        status: issue.state,
        assignee: issue.assignees?.[0]?.login,
        labels: issue.labels?.map((l: any) => l.name) || [],
        author: issue.author?.login || undefined,
      }))
    } catch (error: any) {
      throw new Error(`Failed to list issues: ${error.message}`)
    }
  }

  async updateIssue(id: string, updates: IssueUpdate): Promise<Issue> {
    try {
      let command = `gh issue edit ${id} --repo ${this.repo}`
      
      if (updates.title) {
        command += ` --title "${updates.title.replace(/"/g, '\\"')}"`
      }
      
      if (updates.body !== undefined) {
        command += ` --body "${(updates.body || '').replace(/"/g, '\\"')}"`
      }
      
      if (updates.state) {
        if (updates.state === 'closed') {
          command += ' --state closed'
        } else {
          command += ' --state open'
        }
      }
      
      if (updates.assignee) {
        command += ` --assignee ${updates.assignee}`
      }
      
      if (updates.labels && updates.labels.length > 0) {
        command += ` --add-label "${updates.labels.join(',')}"`
      }
      
      if (updates.removeLabels && updates.removeLabels.length > 0) {
        command += ` --remove-label "${updates.removeLabels.join(',')}"`
      }

      await execAsync(command)
      
      // Fetch updated issue
      const updatedIssue = await this.getIssueById(id)
      if (!updatedIssue) {
        throw new Error(`Failed to retrieve updated issue ${id}`)
      }
      
      return updatedIssue
    } catch (error: any) {
      throw new Error(`Failed to update issue ${id}: ${error.message}`)
    }
  }

  private async getFixedIssuesFromAPI(user?: string): Promise<Issue[]> {
    // Fallback implementation using GitHub API
    // This would require @octokit/rest or similar
    // For now, return empty array if gh CLI fails
    return []
  }

  async createIssue(issue: IssueCreate): Promise<Issue> {
    try {
      let command = `gh issue create --repo ${this.repo} --title "${issue.title.replace(/"/g, '\\"')}"`
      
      if (issue.body) {
        command += ` --body "${issue.body.replace(/"/g, '\\"')}"`
      }
      
      if (issue.assignee) {
        command += ` --assignee ${issue.assignee}`
      }
      
      if (issue.labels && issue.labels.length > 0) {
        command += ` --label "${issue.labels.join(',')}"`
      }

      const {stdout} = await execAsync(command)
      
      // Extract issue number from output (e.g., "https://github.com/owner/repo/issues/42")
      const match = stdout.match(/issues\/(\d+)/)
      if (!match) {
        throw new Error('Failed to extract issue number from GitHub CLI output')
      }
      
      const issueId = match[1]
      
      // Fetch the created issue to return full details
      const createdIssue = await this.getIssueById(issueId)
      if (!createdIssue) {
        throw new Error(`Failed to retrieve created issue ${issueId}`)
      }
      
      return createdIssue
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`)
    }
  }

  private getRepoFromGit(): string {
    try {
      // Try to get repo from git remote
      const {execSync} = require('child_process')
      const remote = execSync('git config --get remote.origin.url', {encoding: 'utf-8'}).trim()
      // Convert git@github.com:owner/repo.git to owner/repo
      const match = remote.match(/(?:git@github\.com:|https:\/\/github\.com\/)([^/]+\/[^/]+?)(?:\.git)?$/)
      return match ? match[1] : ''
    } catch {
      return ''
    }
  }
}

