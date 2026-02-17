import {describe, it, expect} from 'vitest'
import {
  formatErrorMessage,
  formatErrorWithSuggestions,
  createValidationError,
  createConfigError,
  createGitWorkflowError,
  createVersionError,
  createTrackerError,
  createFileError,
  wrapError,
  isRecoverableError,
} from '../index'
import {SDLCError, ErrorCode} from '../types'

describe('Error Handling Utilities', () => {
  describe('formatErrorMessage', () => {
    it('should format SDLCError with suggestion', () => {
      const error = createValidationError('Invalid input', {
        suggestion: 'Please provide a valid value',
      })
      const formatted = formatErrorMessage(error, true)
      expect(formatted).toContain('❌')
      expect(formatted).toContain('Invalid input')
      expect(formatted).toContain('Please provide a valid value')
    })

    it('should format SDLCError without suggestion when includeSuggestion is false', () => {
      const error = createValidationError('Invalid input', {
        suggestion: 'Please provide a valid value',
      })
      const formatted = formatErrorMessage(error, false)
      expect(formatted).toContain('❌')
      expect(formatted).toContain('Invalid input')
      expect(formatted).not.toContain('Please provide a valid value')
    })

    it('should format regular Error', () => {
      const error = new Error('Something went wrong')
      const formatted = formatErrorMessage(error)
      expect(formatted).toBe('❌ Something went wrong')
    })

    it('should include command in suggestion when provided', () => {
      const error = createValidationError('Missing PR', {
        suggestion: 'Create a PR first',
        command: 'gh pr create',
      })
      const formatted = formatErrorMessage(error, true)
      expect(formatted).toContain('Create a PR first')
      expect(formatted).toContain('Run: gh pr create')
    })
  })

  describe('formatErrorWithSuggestions', () => {
    it('should format error with title and suggestions', () => {
      const formatted = formatErrorWithSuggestions(
        'WORKFLOW VIOLATION',
        'Cannot start release from main branch',
        [
          'Create a feature branch first',
          'Run: git checkout -b feature/description',
        ]
      )
      expect(formatted).toContain('❌ WORKFLOW VIOLATION')
      expect(formatted).toContain('Cannot start release from main branch')
      expect(formatted).toContain('1. Create a feature branch first')
      expect(formatted).toContain('2. Run: git checkout -b feature/description')
    })

    it('should format error without suggestions', () => {
      const formatted = formatErrorWithSuggestions('ERROR', 'Something went wrong')
      expect(formatted).toContain('❌ ERROR')
      expect(formatted).toContain('Something went wrong')
      expect(formatted).not.toContain('Next steps')
    })
  })

  describe('createValidationError', () => {
    it('should create validation error with context', () => {
      const error = createValidationError('Invalid input', {
        field: 'title',
        value: '',
      })
      expect(error).toBeInstanceOf(SDLCError)
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.message).toBe('Invalid input')
      expect(error.context?.field).toBe('title')
    })
  })

  describe('createConfigError', () => {
    it('should create config error', () => {
      const error = createConfigError('Invalid config value')
      expect(error.code).toBe(ErrorCode.CONFIG_ERROR)
    })
  })

  describe('createGitWorkflowError', () => {
    it('should create git workflow error', () => {
      const error = createGitWorkflowError('Working tree not clean')
      expect(error.code).toBe(ErrorCode.GIT_ERROR)
    })
  })

  describe('createVersionError', () => {
    it('should create version error', () => {
      const error = createVersionError('Version file not found')
      expect(error.code).toBe(ErrorCode.VERSION_ERROR)
    })
  })

  describe('createTrackerError', () => {
    it('should create tracker error', () => {
      const error = createTrackerError('Issue not found')
      expect(error.code).toBe(ErrorCode.TRACKER_ERROR)
    })
  })

  describe('createFileError', () => {
    it('should create file error with original error', () => {
      const originalError = new Error('ENOENT')
      const error = createFileError('File not found', undefined, originalError)
      expect(error.code).toBe(ErrorCode.FILE_ERROR)
      expect(error.originalError).toBe(originalError)
    })
  })

  describe('wrapError', () => {
    it('should wrap error with context', () => {
      const originalError = new Error('Original error')
      const wrapped = wrapError(
        originalError,
        ErrorCode.FILE_ERROR,
        'Failed to read file',
        {field: 'path'}
      )
      expect(wrapped).toBeInstanceOf(SDLCError)
      expect(wrapped.code).toBe(ErrorCode.FILE_ERROR)
      expect(wrapped.message).toBe('Failed to read file')
      expect(wrapped.originalError).toBe(originalError)
    })
  })

  describe('isRecoverableError', () => {
    it('should return true for recoverable errors', () => {
      const error = new SDLCError(
        ErrorCode.WORKING_TREE_NOT_CLEAN,
        'Working tree not clean'
      )
      expect(isRecoverableError(error)).toBe(true)
    })

    it('should return false for non-recoverable errors', () => {
      const error = new SDLCError(
        ErrorCode.VERSION_PARSE_ERROR,
        'Invalid version format'
      )
      expect(isRecoverableError(error)).toBe(false)
    })

    it('should return false for non-SDLCError', () => {
      const error = new Error('Regular error')
      expect(isRecoverableError(error)).toBe(false)
    })
  })
})
