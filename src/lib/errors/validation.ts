/**
 * Input validation utilities
 */

import {createValidationError} from './index'
import {ErrorCode, ErrorContext} from './types'

/**
 * Validate that a value is not empty
 */
export function validateNotEmpty(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    const context: ErrorContext = {
      field: fieldName,
      value,
      suggestion: `Provide a value for ${fieldName}`,
    }
    throw createValidationError(`${fieldName} is required`, context)
  }
}

/**
 * Validate that a value is a string
 */
export function validateString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string') {
    const context: ErrorContext = {
      field: fieldName,
      value,
      suggestion: `${fieldName} must be a string`,
    }
    throw createValidationError(`${fieldName} must be a string`, context)
  }
}

/**
 * Validate that a value is one of the allowed options
 */
export function validateOneOf<T>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): asserts value is T {
  if (!allowedValues.includes(value as T)) {
    const context: ErrorContext = {
      field: fieldName,
      value,
      suggestion: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    }
    throw createValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      context
    )
  }
}

/**
 * Validate that a value matches a pattern
 */
export function validatePattern(
  value: string,
  fieldName: string,
  pattern: RegExp,
  patternDescription: string
): void {
  if (!pattern.test(value)) {
    const context: ErrorContext = {
      field: fieldName,
      value,
      suggestion: `${fieldName} must match: ${patternDescription}`,
    }
    throw createValidationError(
      `${fieldName} must match: ${patternDescription}`,
      context
    )
  }
}

/**
 * Validate semantic version format
 */
export function validateSemanticVersion(version: string): void {
  const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/
  validatePattern(version, 'version', semverPattern, 'semantic version (e.g., 1.0.0)')
}

/**
 * Validate GitHub repository format (owner/repo)
 */
export function validateRepoFormat(repo: string): void {
  const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/
  validatePattern(repo, 'repo', repoPattern, 'owner/repo-name')
}

/**
 * Validate issue ID format
 */
export function validateIssueId(id: string | number): void {
  const idStr = String(id)
  const idPattern = /^\d+$/
  validatePattern(idStr, 'issue ID', idPattern, 'numeric ID')
}

/**
 * Sanitize string input (trim whitespace)
 */
export function sanitizeString(value: string): string {
  return value.trim()
}

/**
 * Sanitize array input (remove empty values, trim strings)
 */
export function sanitizeArray<T>(values: T[]): T[] {
  return values
    .filter(value => {
      if (typeof value === 'string') {
        return value.trim() !== ''
      }
      return value !== null && value !== undefined
    })
    .map(value => {
      if (typeof value === 'string') {
        return value.trim() as T
      }
      return value
    })
}
