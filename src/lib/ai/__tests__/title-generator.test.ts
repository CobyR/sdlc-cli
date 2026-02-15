import {describe, it, expect} from 'vitest'
import {generatePRTitle, TitleGenerationContext} from '../title-generator'

describe('Title Generator', () => {
  describe('generatePRTitle', () => {
    it('should generate title from first work item', async () => {
      const context: TitleGenerationContext = {
        workItems: [
          {id: '1', title: 'Add new feature'},
          {id: '2', title: 'Fix bug'},
        ],
        gitChanges: {},
      }

      const title = await generatePRTitle(context)

      expect(title).toBe('Add new feature')
    })

    it('should return default title when no work items', async () => {
      const context: TitleGenerationContext = {
        workItems: [],
        gitChanges: {},
      }

      const title = await generatePRTitle(context)

      expect(title).toBe('Release with enhancements and bug fixes')
    })

    it('should truncate long titles', async () => {
      const longTitle = 'A'.repeat(100)
      const context: TitleGenerationContext = {
        workItems: [{id: '1', title: longTitle}],
        gitChanges: {},
      }

      const title = await generatePRTitle(context)

      expect(title.length).toBeLessThanOrEqual(80)
      expect(title).toContain('...')
    })

    it('should handle work items with type', async () => {
      const context: TitleGenerationContext = {
        workItems: [
          {id: '1', title: 'Feature implementation', type: 'feature'},
        ],
        gitChanges: {},
      }

      const title = await generatePRTitle(context)

      expect(title).toBe('Feature implementation')
    })
  })
})
