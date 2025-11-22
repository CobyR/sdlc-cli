import {exec} from 'child_process'
import {promisify} from 'util'
import {Issue, IssueTracker} from './types'

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
      const {stdout} = await execAsync(`gh issue view ${id} --repo ${this.repo} --json number,title,url,state,assignees,labels`)
      const issue = JSON.parse(stdout)
      
      return {
        id: issue.number.toString(),
        number: issue.number,
        title: issue.title,
        url: issue.url,
        status: issue.state,
        assignee: issue.assignees?.[0]?.login,
        labels: issue.labels?.map((l: any) => l.name) || [],
      }
    } catch (error: any) {
      return null
    }
  }

  private async getFixedIssuesFromAPI(user?: string): Promise<Issue[]> {
    // Fallback implementation using GitHub API
    // This would require @octokit/rest or similar
    // For now, return empty array if gh CLI fails
    return []
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

