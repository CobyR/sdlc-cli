import {describe, it, expect} from 'vitest'
import {
  validateNotEmpty,
  validateString,
  validateOneOf,
  validatePattern,
  validateSemanticVersion,
  validateRepoFormat,
  validateIssueId,
  sanitizeString,
  sanitizeArray,
} from '../validation'
import {SDLCError, ErrorCode} from '../types'

describe('Validation Utilities', () => {
  describe('validateNotEmpty', () => {
    it('should pass for non-empty string', () => {
      expect(() => validateNotEmpty('value', 'field')).not.toThrow()
    })

    it('should throw for empty string', () => {
      expect(() => validateNotEmpty('', 'field')).toThrow(SDLCError)
      try {
        validateNotEmpty('', 'field')
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(error.message).toContain('field is required')
      }
    })

    it('should throw for undefined', () => {
      expect(() => validateNotEmpty(undefined, 'field')).toThrow()
    })

    it('should throw for null', () => {
      expect(() => validateNotEmpty(null, 'field')).toThrow()
    })
  })

  describe('validateString', () => {
    it('should pass for string', () => {
      expect(() => validateString('value', 'field')).not.toThrow()
    })

    it('should throw for number', () => {
      expect(() => validateString(123, 'field')).toThrow()
    })

    it('should throw for object', () => {
      expect(() => validateString({}, 'field')).toThrow()
    })
  })

  describe('validateOneOf', () => {
    it('should pass for valid value', () => {
      expect(() => validateOneOf('a', 'field', ['a', 'b', 'c'] as const)).not.toThrow()
    })

    it('should throw for invalid value', () => {
      expect(() => validateOneOf('d', 'field', ['a', 'b', 'c'] as const)).toThrow()
    })

    it('should work with type assertion', () => {
      const values = ['a', 'b', 'c'] as const
      const value: unknown = 'a'
      validateOneOf(value, 'field', values)
      // TypeScript should now know value is 'a' | 'b' | 'c'
      expect(value).toBe('a')
    })
  })

  describe('validatePattern', () => {
    it('should pass for matching pattern', () => {
      expect(() => validatePattern('abc123', 'field', /^[a-z0-9]+$/, 'alphanumeric')).not.toThrow()
    })

    it('should throw for non-matching pattern', () => {
      expect(() => validatePattern('abc-123', 'field', /^[a-z0-9]+$/, 'alphanumeric')).toThrow()
    })
  })

  describe('validateSemanticVersion', () => {
    it('should pass for valid semantic version', () => {
      expect(() => validateSemanticVersion('1.0.0')).not.toThrow()
      expect(() => validateSemanticVersion('1.2.3')).not.toThrow()
      expect(() => validateSemanticVersion('1.0.0-alpha')).not.toThrow()
      expect(() => validateSemanticVersion('1.0.0+20230101')).not.toThrow()
    })

    it('should throw for invalid version', () => {
      expect(() => validateSemanticVersion('1.0')).toThrow()
      expect(() => validateSemanticVersion('v1.0.0')).toThrow()
      expect(() => validateSemanticVersion('1.0.0.0')).toThrow()
    })
  })

  describe('validateRepoFormat', () => {
    it('should pass for valid repo format', () => {
      expect(() => validateRepoFormat('owner/repo')).not.toThrow()
      expect(() => validateRepoFormat('owner-name/repo_name')).not.toThrow()
    })

    it('should throw for invalid repo format', () => {
      expect(() => validateRepoFormat('owner')).toThrow()
      expect(() => validateRepoFormat('owner/repo/path')).toThrow()
      expect(() => validateRepoFormat('owner repo')).toThrow()
    })
  })

  describe('validateIssueId', () => {
    it('should pass for valid issue ID', () => {
      expect(() => validateIssueId('123')).not.toThrow()
      expect(() => validateIssueId(123)).not.toThrow()
    })

    it('should throw for invalid issue ID', () => {
      expect(() => validateIssueId('abc')).toThrow()
      expect(() => validateIssueId('12.3')).toThrow()
    })
  })

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  value  ')).toBe('value')
    })

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('')
    })
  })

  describe('sanitizeArray', () => {
    it('should remove empty strings', () => {
      expect(sanitizeArray(['a', '', 'b', '  ', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('should trim string values', () => {
      expect(sanitizeArray(['  a  ', 'b', '  c  '])).toEqual(['a', 'b', 'c'])
    })

    it('should remove null and undefined', () => {
      expect(sanitizeArray(['a', null, 'b', undefined, 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('should preserve non-string values', () => {
      expect(sanitizeArray([1, 2, 3])).toEqual([1, 2, 3])
    })
  })
})
