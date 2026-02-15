import {describe, it, expect, beforeEach, vi} from 'vitest'
import {GitHubIssuesTracker} from '../github-issues'
import {testIssue} from '../../../__tests__/helpers/fixtures'
import {exec} from 'child_process'

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  default: {
    exec: vi.fn(),
  },
}))

describe('GitHubIssuesTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFixedIssues', () => {
    it('should return fixed issues with "fixed" label', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Fixed Issue',
          state: 'open',
          labels: [{name: 'fixed'}],
          assignees: [{login: 'user1'}],
          url: 'https://github.com/test/repo/issues/1',
        },
        {
          number: 2,
          title: 'Open Issue',
          state: 'open',
          labels: [{name: 'bug'}],
          assignees: [],
          url: 'https://github.com/test/repo/issues/2',
        },
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const fixedIssues = await tracker.getFixedIssues()

      expect(fixedIssues).toHaveLength(1)
      expect(fixedIssues[0].id).toBe('1')
      expect(fixedIssues[0].title).toBe('Fixed Issue')
      expect(fixedIssues[0].labels).toContain('fixed')
    })

    it('should filter by user if provided', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Fixed by user1',
          state: 'open',
          labels: [{name: 'fixed'}],
          assignees: [{login: 'user1'}],
          url: 'https://github.com/test/repo/issues/1',
        },
        {
          number: 2,
          title: 'Fixed by user2',
          state: 'open',
          labels: [{name: 'fixed'}],
          assignees: [{login: 'user2'}],
          url: 'https://github.com/test/repo/issues/2',
        },
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const fixedIssues = await tracker.getFixedIssues('user1')

      expect(fixedIssues).toHaveLength(1)
      expect(fixedIssues[0].assignee).toBe('user1')
    })
  })

  describe('getIssueById', () => {
    it('should return issue by ID', async () => {
      const mockIssue = {
        number: 42,
        title: 'Test Issue',
        state: 'open',
        labels: [{name: 'bug'}],
        assignees: [{login: 'user1'}],
        body: 'Issue description',
        author: {login: 'author1'},
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.getIssueById('42')

      expect(issue).not.toBeNull()
      expect(issue?.id).toBe('42')
      expect(issue?.title).toBe('Test Issue')
      expect(issue?.assignee).toBe('user1')
      expect(issue?.author).toBe('author1')
    })

    it('should return null if issue not found', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('not found'), {stdout: '', stderr: 'not found'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.getIssueById('999')

      expect(issue).toBeNull()
    })
  })

  describe('listIssues', () => {
    it('should list issues with filters', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue 1',
          state: 'open',
          labels: [],
          assignees: [],
          author: {login: 'user1'},
          url: 'https://github.com/test/repo/issues/1',
        },
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issues = await tracker.listIssues({
        state: 'open',
        limit: 10,
      })

      expect(issues).toHaveLength(1)
      expect(issues[0].id).toBe('1')
    })
  })

  describe('createIssue', () => {
    it('should create a new issue', async () => {
      const mockOutput = 'https://github.com/test/repo/issues/42'
      const mockIssue = {
        number: 42,
        title: 'New Issue',
        state: 'open',
        labels: [],
        assignees: [],
        body: 'Description',
        url: 'https://github.com/test/repo/issues/42',
      }

      // Mock create command
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )
      // Mock getIssueById call
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.createIssue({
        title: 'New Issue',
        body: 'Description',
      })

      expect(issue).not.toBeNull()
      expect(issue.id).toBe('42')
      expect(issue.title).toBe('New Issue')
    })
  })

  describe('updateIssue', () => {
    it('should update issue properties', async () => {
      const mockIssue = {
        number: 42,
        title: 'Updated Issue',
        state: 'open',
        labels: [{name: 'bug'}],
        assignees: [{login: 'user1'}],
        body: 'Updated description',
        url: 'https://github.com/test/repo/issues/42',
      }

      // Mock getIssueById for existing issue check
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )
      // Mock update command (multiple calls for different fields)
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      // Mock getIssueById after update
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const updated = await tracker.updateIssue('42', {
        title: 'Updated Issue',
      })

      expect(updated.title).toBe('Updated Issue')
    })
  })

  describe('closeIssue', () => {
    it('should close issue with release comment', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.closeIssue(testIssue, '1.0.0')

      expect(vi.mocked(exec)).toHaveBeenCalled()
    })
  })

  describe('label management', () => {
    it('should list labels', async () => {
      const mockLabels = [
        {name: 'bug', color: 'd73a4a', description: 'Something is broken'},
        {name: 'enhancement', color: 'a2eeef', description: null},
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockLabels), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const labels = await tracker.listLabels()

      expect(labels).toHaveLength(2)
      expect(labels[0].name).toBe('bug')
      expect(labels[0].color).toBe('d73a4a')
    })

    it('should get label by name', async () => {
      const mockLabels = [
        {name: 'bug', color: 'd73a4a', description: 'Something is broken'},
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockLabels), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.getLabel('bug')

      expect(label).not.toBeNull()
      expect(label?.name).toBe('bug')
    })

    it('should create label', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([{name: 'new-label', color: 'ffffff'}]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.createLabel({
        name: 'new-label',
        color: 'ffffff',
      })

      expect(label.name).toBe('new-label')
    })
  })
})
