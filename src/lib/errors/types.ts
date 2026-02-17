/**
 * Error types and codes for standardized error handling
 */

export enum ErrorCode {
  // Validation errors (1xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Configuration errors (2xx)
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  INVALID_CONFIG_VALUE = 'INVALID_CONFIG_VALUE',
  
  // Git errors (3xx)
  GIT_ERROR = 'GIT_ERROR',
  NOT_ON_MAIN_BRANCH = 'NOT_ON_MAIN_BRANCH',
  WORKING_TREE_NOT_CLEAN = 'WORKING_TREE_NOT_CLEAN',
  PR_NOT_FOUND = 'PR_NOT_FOUND',
  VERSION_NOT_BUMPED = 'VERSION_NOT_BUMPED',
  
  // Version management errors (4xx)
  VERSION_ERROR = 'VERSION_ERROR',
  VERSION_FILE_NOT_FOUND = 'VERSION_FILE_NOT_FOUND',
  VERSION_PARSE_ERROR = 'VERSION_PARSE_ERROR',
  VERSION_UPDATE_FAILED = 'VERSION_UPDATE_FAILED',
  
  // Issue tracker errors (5xx)
  TRACKER_ERROR = 'TRACKER_ERROR',
  ISSUE_NOT_FOUND = 'ISSUE_NOT_FOUND',
  ISSUE_CREATE_FAILED = 'ISSUE_CREATE_FAILED',
  ISSUE_UPDATE_FAILED = 'ISSUE_UPDATE_FAILED',
  
  // File system errors (6xx)
  FILE_ERROR = 'FILE_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  
  // External tool errors (7xx)
  EXTERNAL_TOOL_ERROR = 'EXTERNAL_TOOL_ERROR',
  GITHUB_CLI_ERROR = 'GITHUB_CLI_ERROR',
  GIT_COMMAND_ERROR = 'GIT_COMMAND_ERROR',
}

export interface ErrorContext {
  field?: string
  value?: unknown
  suggestion?: string
  command?: string
  [key: string]: unknown
}

export class SDLCError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: ErrorContext,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'SDLCError'
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SDLCError)
    }
  }
}

/**
 * Check if an error is an SDLCError
 */
export function isSDLCError(error: unknown): error is SDLCError {
  return error instanceof SDLCError
}
