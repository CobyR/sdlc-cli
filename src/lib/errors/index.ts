/**
 * Standardized error handling utilities
 */

import {Command} from '@oclif/core'
import {SDLCError, ErrorCode, ErrorContext, isSDLCError} from './types'

/**
 * Format error message with emoji and structure
 */
export function formatErrorMessage(error: Error | SDLCError, includeSuggestion = true): string {
  const prefix = '❌'
  
  if (isSDLCError(error)) {
    let message = `${prefix} ${error.message}`
    
    if (includeSuggestion && error.context?.suggestion) {
      message += `\n   ${error.context.suggestion}`
    }
    
    if (error.context?.command) {
      message += `\n   Run: ${error.context.command}`
    }
    
    return message
  }
  
  return `${prefix} ${error.message}`
}

/**
 * Format error with actionable suggestions
 */
export function formatErrorWithSuggestions(
  title: string,
  message: string,
  suggestions: string[] = []
): string {
  let formatted = `❌ ${title}: ${message}`
  
  if (suggestions.length > 0) {
    formatted += '\n   Next steps:'
    suggestions.forEach((suggestion, index) => {
      formatted += `\n   ${index + 1}. ${suggestion}`
    })
  }
  
  return formatted
}

/**
 * Handle error in OCLIF command context
 */
export function handleCommandError(command: Command, error: unknown): never {
  if (isSDLCError(error)) {
    const message = formatErrorMessage(error, true)
    command.error(message, {exit: 1})
  }
  
  if (error instanceof Error) {
    const message = formatErrorMessage(error, false)
    command.error(message, {exit: 1})
  }
  
  command.error('An unknown error occurred', {exit: 1})
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(ErrorCode.VALIDATION_ERROR, message, context)
}

/**
 * Create configuration error
 */
export function createConfigError(
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(ErrorCode.CONFIG_ERROR, message, context)
}

/**
 * Create git workflow error
 */
export function createGitWorkflowError(
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(ErrorCode.GIT_ERROR, message, context)
}

/**
 * Create version management error
 */
export function createVersionError(
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(ErrorCode.VERSION_ERROR, message, context)
}

/**
 * Create issue tracker error
 */
export function createTrackerError(
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(ErrorCode.TRACKER_ERROR, message, context)
}

/**
 * Create file system error
 */
export function createFileError(
  message: string,
  context?: ErrorContext,
  originalError?: Error
): SDLCError {
  return new SDLCError(ErrorCode.FILE_ERROR, message, context, originalError)
}

/**
 * Wrap external error with context
 */
export function wrapError(
  error: Error,
  code: ErrorCode,
  message: string,
  context?: ErrorContext
): SDLCError {
  return new SDLCError(code, message, context, error)
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (!isSDLCError(error)) {
    return false
  }
  
  // Some errors are recoverable with user action
  const recoverableCodes = [
    ErrorCode.WORKING_TREE_NOT_CLEAN,
    ErrorCode.PR_NOT_FOUND,
    ErrorCode.VERSION_NOT_BUMPED,
    ErrorCode.CONFIG_NOT_FOUND,
  ]
  
  return recoverableCodes.includes(error.code)
}
