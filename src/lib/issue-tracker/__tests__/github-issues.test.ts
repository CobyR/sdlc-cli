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

  describe('getFixedIssues error handling', () => {
    it('should fallback to API when gh CLI fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('gh CLI failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const fixedIssues = await tracker.getFixedIssues()

      // Should return empty array from API fallback
      expect(fixedIssues).toEqual([])
    })

    it('should handle case-insensitive fixed label matching', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Fixed Issue',
          state: 'OPEN', // uppercase
          labels: [{name: 'FIXED'}], // uppercase
          assignees: [],
          url: 'https://github.com/test/repo/issues/1',
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
      expect(fixedIssues[0].labels).toContain('FIXED')
    })

    it('should handle issues without labels', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue without labels',
          state: 'open',
          labels: [],
          assignees: [],
          url: 'https://github.com/test/repo/issues/1',
        },
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const fixedIssues = await tracker.getFixedIssues()

      expect(fixedIssues).toHaveLength(0)
    })

    it('should handle issues without assignees when filtering by user', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue without assignee',
          state: 'open',
          labels: [{name: 'fixed'}],
          assignees: [],
          url: 'https://github.com/test/repo/issues/1',
        },
      ]

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const fixedIssues = await tracker.getFixedIssues('user1')

      expect(fixedIssues).toHaveLength(0)
    })
  })

  describe('closeIssue error handling', () => {
    it('should throw error when closing issue fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed to close'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.closeIssue(testIssue, '1.0.0')).rejects.toThrow('Failed to close issue')
    })

    it('should handle issue with number property', async () => {
      const issueWithNumber = {...testIssue, number: 42}
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.closeIssue(issueWithNumber, '1.0.0')

      expect(vi.mocked(exec)).toHaveBeenCalled()
    })

    it('should escape quotes in version comment', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      // Use a version with quotes to test escaping
      await tracker.closeIssue(testIssue, '1.0.0"test')

      const callArgs = vi.mocked(exec).mock.calls[0]
      // The comment contains the version, and quotes in the version should be escaped
      expect(callArgs[0]).toContain('\\"')
    })
  })

  describe('getIssueById edge cases', () => {
    it('should handle issue without body', async () => {
      const mockIssue = {
        number: 42,
        title: 'Test Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.getIssueById('42')

      expect(issue?.body).toBeUndefined()
    })

    it('should handle issue without author', async () => {
      const mockIssue = {
        number: 42,
        title: 'Test Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.getIssueById('42')

      expect(issue?.author).toBeUndefined()
    })

    it('should handle issue without assignees', async () => {
      const mockIssue = {
        number: 42,
        title: 'Test Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.getIssueById('42')

      expect(issue?.assignee).toBeUndefined()
    })
  })

  describe('listIssues comprehensive filters', () => {
    it('should list issues with all filters', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Issue 1',
          state: 'open',
          labels: [{name: 'bug'}],
          assignees: [{login: 'user1'}],
          author: {login: 'author1'},
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
        state: 'closed',
        assignee: 'user1',
        author: 'author1',
        labels: ['bug', 'priority:high'],
        limit: 50,
      })

      expect(issues).toHaveLength(1)
      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--state closed')
      expect(callArgs[0]).toContain('--assignee user1')
      expect(callArgs[0]).toContain('--author author1')
      expect(callArgs[0]).toContain('--label')
      expect(callArgs[0]).toContain('--limit 50')
    })

    it('should use default state and limit when not provided', async () => {
      const mockIssues: any[] = []

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.listIssues()

      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--state open')
      expect(callArgs[0]).toContain('--limit 30')
    })

    it('should throw error when listIssues fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.listIssues()).rejects.toThrow('Failed to list issues')
    })

    it('should handle empty labels array', async () => {
      const mockIssues: any[] = []

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssues), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.listIssues({labels: []})

      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).not.toContain('--label')
    })
  })

  describe('createIssue edge cases', () => {
    it('should create issue without body', async () => {
      const mockOutput = 'https://github.com/test/repo/issues/42'
      const mockIssue = {
        number: 42,
        title: 'New Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.createIssue({
        title: 'New Issue',
      })

      expect(issue).not.toBeNull()
      expect(issue.id).toBe('42')
    })

    it('should create issue with assignee and labels', async () => {
      const mockOutput = 'https://github.com/test/repo/issues/42'
      const mockIssue = {
        number: 42,
        title: 'New Issue',
        state: 'open',
        labels: [{name: 'bug'}],
        assignees: [{login: 'user1'}],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const issue = await tracker.createIssue({
        title: 'New Issue',
        body: 'Description',
        assignee: 'user1',
        labels: ['bug', 'priority:high'],
      })

      expect(issue).not.toBeNull()
      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--assignee user1')
      expect(callArgs[0]).toContain('--label')
    })

    it('should throw error when issue number extraction fails', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: 'Invalid output', stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.createIssue({
          title: 'New Issue',
        })
      ).rejects.toThrow('Failed to extract issue number')
    })

    it('should throw error when created issue retrieval fails', async () => {
      const mockOutput = 'https://github.com/test/repo/issues/42'

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(new Error('Not found'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.createIssue({
          title: 'New Issue',
        })
      ).rejects.toThrow('Failed to retrieve created issue')
    })

    it('should escape quotes in title and body', async () => {
      const mockOutput = 'https://github.com/test/repo/issues/42'
      const mockIssue = {
        number: 42,
        title: 'Issue with "quotes"',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: mockOutput, stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.createIssue({
        title: 'Issue with "quotes"',
        body: 'Body with "quotes"',
      })

      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('\\"')
    })
  })

  describe('updateIssue comprehensive scenarios', () => {
    it('should update issue with all fields', async () => {
      const mockIssue = {
        number: 42,
        title: 'Updated Issue',
        state: 'open',
        labels: [{name: 'bug'}, {name: 'priority:high'}],
        assignees: [{login: 'user2'}],
        body: 'Updated description',
        url: 'https://github.com/test/repo/issues/42',
      }

      let callCount = 0
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callCount++
          if (callCount === 1) {
            // First call: getIssueById to check existing assignee
            callback(null, {stdout: JSON.stringify({...mockIssue, assignees: [{login: 'user1'}]}), stderr: ''})
          } else if (callCount === 2) {
            // Second call: remove assignee
            callback(null, {stdout: '', stderr: ''})
          } else if (callCount === 3) {
            // Third call: update issue
            callback(null, {stdout: '', stderr: ''})
          } else if (callCount === 4) {
            // Fourth call: getIssueById after update
            callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
          }
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const updated = await tracker.updateIssue('42', {
        title: 'Updated Issue',
        body: 'Updated description',
        state: 'open',
        assignee: 'user2',
        labels: ['bug', 'priority:high'],
        removeLabels: ['old-label'],
      })

      expect(updated.title).toBe('Updated Issue')
      const callArgs = vi.mocked(exec).mock.calls
      expect(callArgs.some(call => call[0].includes('--remove-assignee user1'))).toBe(true)
      expect(callArgs.some(call => call[0].includes('--add-assignee user2'))).toBe(true)
      expect(callArgs.some(call => call[0].includes('--add-label'))).toBe(true)
      expect(callArgs.some(call => call[0].includes('--remove-label'))).toBe(true)
    })

    it('should update issue state to closed', async () => {
      const mockIssue = {
        number: 42,
        title: 'Issue',
        state: 'closed',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.updateIssue('42', {
        state: 'closed',
      })

      const callArgs = vi.mocked(exec).mock.calls.find(call => call[0].includes('--state closed'))
      expect(callArgs).toBeDefined()
    })

    it('should update issue state to open', async () => {
      const mockIssue = {
        number: 42,
        title: 'Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.updateIssue('42', {
        state: 'open',
      })

      const callArgs = vi.mocked(exec).mock.calls.find(call => call[0].includes('--state open'))
      expect(callArgs).toBeDefined()
    })

    it('should handle assignee update when no existing assignee', async () => {
      const mockIssue = {
        number: 42,
        title: 'Issue',
        state: 'open',
        labels: [],
        assignees: [],
        url: 'https://github.com/test/repo/issues/42',
      }

      let callCount = 0
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callCount++
          if (callCount === 1) {
            // First call: getIssueById to check existing assignee
            callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
          } else if (callCount === 2) {
            // Second call: update issue with new assignee (no remove needed)
            callback(null, {stdout: '', stderr: ''})
          } else if (callCount === 3) {
            // Third call: getIssueById after update
            callback(null, {stdout: JSON.stringify({...mockIssue, assignees: [{login: 'user1'}]}), stderr: ''})
          }
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.updateIssue('42', {
        assignee: 'user1',
      })

      // Should not try to remove assignee
      const removeCall = vi.mocked(exec).mock.calls.find(call => call[0].includes('--remove-assignee'))
      expect(removeCall).toBeUndefined()
    })

    it('should handle assignee removal failure gracefully', async () => {
      const mockIssue = {
        number: 42,
        title: 'Issue',
        state: 'open',
        labels: [],
        assignees: [{login: 'user1'}],
        url: 'https://github.com/test/repo/issues/42',
      }

      let callCount = 0
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callCount++
          if (callCount === 1) {
            // First call: getIssueById to check existing assignee
            callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
          } else if (callCount === 2) {
            // Second call: remove assignee - should fail but be caught
            callback(new Error('Failed'), {stdout: '', stderr: 'error'})
          } else if (callCount === 3) {
            // Third call: update issue with new assignee
            callback(null, {stdout: '', stderr: ''})
          } else if (callCount === 4) {
            // Fourth call: getIssueById after update
            callback(null, {stdout: JSON.stringify({...mockIssue, assignees: [{login: 'user2'}]}), stderr: ''})
          }
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      // Should not throw even if remove fails
      await tracker.updateIssue('42', {
        assignee: 'user2',
      })

      expect(vi.mocked(exec)).toHaveBeenCalled()
    })

    it('should handle empty body update', async () => {
      const mockIssue = {
        number: 42,
        title: 'Issue',
        state: 'open',
        labels: [],
        assignees: [],
        body: '',
        url: 'https://github.com/test/repo/issues/42',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockIssue), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.updateIssue('42', {
        body: '',
      })

      const callArgs = vi.mocked(exec).mock.calls.find(call => call[0].includes('--body'))
      expect(callArgs).toBeDefined()
    })

    it('should throw error when updated issue retrieval fails', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify({number: 42, title: 'Issue', state: 'open', labels: [], assignees: []}), stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(new Error('Not found'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.updateIssue('42', {title: 'Updated'})).rejects.toThrow('Failed to retrieve updated issue')
    })

    it('should throw error when update fails', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify({number: 42, title: 'Issue', state: 'open', labels: [], assignees: []}), stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Update failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.updateIssue('42', {title: 'Updated'})).rejects.toThrow('Failed to update issue')
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

    it('should throw error when listLabels fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.listLabels()).rejects.toThrow('Failed to list labels')
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

    it('should return null when label not found', async () => {
      const mockLabels: any[] = []

      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify(mockLabels), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.getLabel('nonexistent')

      expect(label).toBeNull()
    })

    it('should throw error when getLabel fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.getLabel('bug')).rejects.toThrow('Failed to get label')
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

    it('should create label with description', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([{name: 'new-label', color: 'ffffff', description: 'Test description'}]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.createLabel({
        name: 'new-label',
        color: '#ffffff',
        description: 'Test description',
      })

      expect(label.name).toBe('new-label')
      expect(label.description).toBe('Test description')
      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--color ffffff') // Should remove # from color
    })

    it('should throw error when createLabel fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.createLabel({
          name: 'new-label',
          color: 'ffffff',
        })
      ).rejects.toThrow('Failed to create label')
    })

    it('should throw error when created label retrieval fails', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.createLabel({
          name: 'new-label',
          color: 'ffffff',
        })
      ).rejects.toThrow('Failed to retrieve created label')
    })

    it('should update label', async () => {
      const mockLabel = {
        name: 'updated-label',
        color: 'ff0000',
        description: 'Updated description',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([mockLabel]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.updateLabel('old-label', {
        name: 'updated-label',
        color: '#ff0000',
        description: 'Updated description',
      })

      expect(label.name).toBe('updated-label')
      expect(label.color).toBe('ff0000')
      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--color ff0000') // Should remove # from color
    })

    it('should update label with partial updates', async () => {
      const mockLabel = {
        name: 'label',
        color: '00ff00',
        description: 'New description',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([mockLabel]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      const label = await tracker.updateLabel('label', {
        description: 'New description',
      })

      expect(label.description).toBe('New description')
    })

    it('should update label with empty description', async () => {
      const mockLabel = {
        name: 'label',
        color: '000000',
      }

      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([mockLabel]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.updateLabel('label', {
        description: '',
      })

      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('--description')
    })

    it('should throw error when updateLabel fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.updateLabel('label', {
          name: 'new-label',
        })
      ).rejects.toThrow('Failed to update label')
    })

    it('should throw error when updated label retrieval fails', async () => {
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )
      vi.mocked(exec).mockImplementationOnce(
        ((command: string, callback: any) => {
          callback(null, {stdout: JSON.stringify([]), stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(
        tracker.updateLabel('label', {
          name: 'new-label',
        })
      ).rejects.toThrow('Failed to retrieve updated label')
    })

    it('should delete label', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(null, {stdout: '', stderr: ''})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await tracker.deleteLabel('label-to-delete')

      const callArgs = vi.mocked(exec).mock.calls[0]
      expect(callArgs[0]).toContain('gh label delete')
      expect(callArgs[0]).toContain('--yes')
    })

    it('should throw error when deleteLabel fails', async () => {
      vi.mocked(exec).mockImplementation(
        ((command: string, callback: any) => {
          callback(new Error('Failed'), {stdout: '', stderr: 'error'})
        }) as any
      )

      const tracker = new GitHubIssuesTracker('test/repo')
      await expect(tracker.deleteLabel('label')).rejects.toThrow('Failed to delete label')
    })
  })

  describe('constructor and getRepoFromGit', () => {
    it('should use provided repo', () => {
      const tracker = new GitHubIssuesTracker('custom/repo')
      expect(tracker).toBeInstanceOf(GitHubIssuesTracker)
    })

    it('should get repo from git when not provided', () => {
      // Mock execSync for getRepoFromGit
      const execSync = vi.fn().mockReturnValue('git@github.com:owner/repo.git\n')
      vi.doMock('child_process', () => ({
        exec: vi.fn(),
        execSync,
      }))

      // This test verifies the constructor doesn't throw
      // The actual getRepoFromGit logic is tested indirectly
      const tracker = new GitHubIssuesTracker()
      expect(tracker).toBeInstanceOf(GitHubIssuesTracker)
    })
  })
})
