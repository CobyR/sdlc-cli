import {exec} from 'child_process'
import {promisify} from 'util'
import {Issue, IssueTracker, IssueFilters, IssueUpdate, IssueCreate, Label, LabelUpdate} from './types'

const execAsync = promisify(exec)

export class GitHubIssuesTracker implements IssueTracker {
  private repo: string

  constructor(repo?: string) {
    this.repo = repo || this.getRepoFromGit()
  }

  async getFixedIssues(user?: string): Promise<Issue[]> {
    try {
      // Get open issues with "fixed" label - these are fixed in code but not yet released
      // They will be closed when released
      let command = `gh issue list --repo ${this.repo} --state open --json number,title,url,state,assignees,labels --limit 100`
      if (user) {
        command += ` --assignee ${user}`
      }

      const {stdout} = await execAsync(command)
      const issues = JSON.parse(stdout)

      return issues
        .filter((issue: any) => {
          // Filter for issues with "fixed" label (case-insensitive)
          const hasFixedLabel = issue.labels?.some((label: any) => 
            label.name.toLowerCase() === 'fixed'
          )
          // Check state (case-insensitive)
          const isOpen = issue.state?.toLowerCase() === 'open'
          // Also filter by assignee if specified
          if (user) {
            const assignee = issue.assignees?.[0]?.login
            return hasFixedLabel && isOpen && assignee === user
          }
          return hasFixedLabel && isOpen
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
      const issueId = issue.number || issue.id
      const comment = `Shipped with Release '${version}'`
      
      // Add comment first
      await execAsync(`gh issue comment ${issueId} --repo ${this.repo} --body "${comment.replace(/"/g, '\\"')}"`)
      
      // Close the issue
      await execAsync(`gh issue close ${issueId} --repo ${this.repo} --comment "${comment.replace(/"/g, '\\"')}"`)
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
      // If updating assignee, first get current issue to check for existing assignees
      if (updates.assignee) {
        const currentIssue = await this.getIssueById(id)
        if (currentIssue && currentIssue.assignee) {
          // Remove existing assignee first
          const removeCommand = `gh issue edit ${id} --repo ${this.repo} --remove-assignee ${currentIssue.assignee}`
          try {
            await execAsync(removeCommand)
          } catch (error: any) {
            // Ignore errors if assignee removal fails (might not exist)
          }
        }
      }

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
        command += ` --add-assignee ${updates.assignee}`
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

  async listLabels(): Promise<Label[]> {
    try {
      const {stdout} = await execAsync(`gh label list --repo ${this.repo} --json name,color,description`)
      const labels = JSON.parse(stdout)
      
      return labels.map((label: any) => ({
        name: label.name,
        color: label.color,
        description: label.description || undefined,
      }))
    } catch (error: any) {
      throw new Error(`Failed to list labels: ${error.message}`)
    }
  }

  async getLabel(name: string): Promise<Label | null> {
    try {
      const {stdout} = await execAsync(`gh label list --repo ${this.repo} --json name,color,description`)
      const labels = JSON.parse(stdout)
      const label = labels.find((l: any) => l.name === name)
      
      if (!label) {
        return null
      }
      
      return {
        name: label.name,
        color: label.color,
        description: label.description || undefined,
      }
    } catch (error: any) {
      throw new Error(`Failed to get label: ${error.message}`)
    }
  }

  async createLabel(label: Label): Promise<Label> {
    try {
      let command = `gh label create "${label.name}" --repo ${this.repo}`
      
      if (label.color) {
        command += ` --color ${label.color.replace('#', '')}`
      }
      
      if (label.description) {
        command += ` --description "${label.description.replace(/"/g, '\\"')}"`
      }

      await execAsync(command)
      
      // Fetch the created label to return full details
      const createdLabel = await this.getLabel(label.name)
      if (!createdLabel) {
        throw new Error(`Failed to retrieve created label ${label.name}`)
      }
      
      return createdLabel
    } catch (error: any) {
      throw new Error(`Failed to create label: ${error.message}`)
    }
  }

  async updateLabel(name: string, updates: LabelUpdate): Promise<Label> {
    try {
      let command = `gh label edit "${name}" --repo ${this.repo}`
      
      if (updates.name) {
        command += ` --name "${updates.name.replace(/"/g, '\\"')}"`
      }
      
      if (updates.color) {
        command += ` --color ${updates.color.replace('#', '')}`
      }
      
      if (updates.description !== undefined) {
        command += ` --description "${(updates.description || '').replace(/"/g, '\\"')}"`
      }

      await execAsync(command)
      
      // Fetch updated label (use new name if it was changed)
      const labelName = updates.name || name
      const updatedLabel = await this.getLabel(labelName)
      if (!updatedLabel) {
        throw new Error(`Failed to retrieve updated label ${labelName}`)
      }
      
      return updatedLabel
    } catch (error: any) {
      throw new Error(`Failed to update label: ${error.message}`)
    }
  }

  async deleteLabel(name: string): Promise<void> {
    try {
      await execAsync(`gh label delete "${name}" --repo ${this.repo} --yes`)
    } catch (error: any) {
      throw new Error(`Failed to delete label: ${error.message}`)
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

