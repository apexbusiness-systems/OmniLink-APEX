/**
 * Advanced error handling with retry logic, categorization, and recovery strategies
 * Production-grade error management for resilient applications
 */

import { logError } from './monitoring';

/**
 * Error categories for proper handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  CRITICAL = 'critical', // Requires immediate action
  HIGH = 'high', // Should be fixed soon
  MEDIUM = 'medium', // Should be addressed
  LOW = 'low', // Minor issue
  INFO = 'info', // Informational
}

/**
 * Categorized error with metadata
 */
export interface CategorizedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  originalError: Error;
  retryable: boolean;
  userMessage: string;
  actionable?: string; // What the user can do
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableStatuses?: number[]; // HTTP status codes to retry
}

/**
 * Default retry configurations by category
 */
export const DEFAULT_RETRY_CONFIGS: Record<ErrorCategory, RetryConfig> = {
  [ErrorCategory.NETWORK]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },
  [ErrorCategory.RATE_LIMIT]: {
    maxAttempts: 2,
    baseDelay: 5000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [429],
  },
  [ErrorCategory.SERVER]: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableStatuses: [500, 502, 503, 504],
  },
  [ErrorCategory.TIMEOUT]: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
  },
  [ErrorCategory.AUTHENTICATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  },
  [ErrorCategory.AUTHORIZATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  },
  [ErrorCategory.VALIDATION]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  },
  [ErrorCategory.CLIENT]: {
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  },
  [ErrorCategory.UNKNOWN]: {
    maxAttempts: 1,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },
};

/**
 * Categorize error based on type and status
 */
export function categorizeError(error: any): CategorizedError {
  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let retryable = false;
  let userMessage = 'An unexpected error occurred. Please try again.';
  let actionable: string | undefined;

  // Network errors
  if (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('NetworkError') ||
    error.name === 'NetworkError'
  ) {
    category = ErrorCategory.NETWORK;
    severity = ErrorSeverity.HIGH;
    retryable = true;
    userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
    actionable = 'Check your internet connection';
  }

  // HTTP status-based categorization
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status;

    if (status === 401) {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      retryable = false;
      userMessage = 'Your session has expired. Please sign in again.';
      actionable = 'Sign in again';
    } else if (status === 403) {
      category = ErrorCategory.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
      userMessage = 'You don\'t have permission to perform this action.';
      actionable = 'Contact your administrator for access';
    } else if (status === 404) {
      category = ErrorCategory.CLIENT;
      severity = ErrorSeverity.LOW;
      retryable = false;
      userMessage = 'The requested resource was not found.';
    } else if (status === 422 || status === 400) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
      retryable = false;
      userMessage = error.message || 'Invalid data submitted. Please check your input.';
      actionable = 'Review your input and try again';
    } else if (status === 429) {
      category = ErrorCategory.RATE_LIMIT;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
      const retryAfter = error.response?.headers?.['retry-after'];
      userMessage = retryAfter
        ? `Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`
        : 'Too many requests. Please wait a moment and try again.';
      actionable = 'Wait a moment before retrying';
    } else if (status === 408 || status === 504) {
      category = ErrorCategory.TIMEOUT;
      severity = ErrorSeverity.MEDIUM;
      retryable = true;
      userMessage = 'Request timed out. The server took too long to respond.';
      actionable = 'Try again';
    } else if (status >= 500) {
      category = ErrorCategory.SERVER;
      severity = ErrorSeverity.HIGH;
      retryable = true;
      userMessage = 'The server encountered an error. Please try again in a moment.';
      actionable = 'Try again in a few moments';
    }
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    category = ErrorCategory.TIMEOUT;
    severity = ErrorSeverity.MEDIUM;
    retryable = true;
    userMessage = 'Request timed out. Please try again.';
    actionable = 'Try again';
  }

  // Supabase-specific errors
  if (error.code) {
    if (error.code === 'PGRST301') {
      category = ErrorCategory.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
      retryable = false;
      userMessage = 'Authentication required. Please sign in.';
      actionable = 'Sign in';
    } else if (error.code === 'PGRST204') {
      category = ErrorCategory.AUTHORIZATION;
      severity = ErrorSeverity.MEDIUM;
      retryable = false;
      userMessage = 'Access denied. You don\'t have permission for this action.';
    }
  }

  return {
    category,
    severity,
    message: error.message || 'Unknown error',
    originalError: error instanceof Error ? error : new Error(String(error)),
    retryable,
    userMessage,
    actionable,
  };
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> {
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIGS[ErrorCategory.NETWORK],
    ...config,
  };

  let lastError: any;

  for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const categorized = categorizeError(error);

      // Don't retry if not retryable
      if (!categorized.retryable && attempt === 0) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxAttempts - 1) {
        throw error;
      }

      // Check if status code is retryable
      const status = (error as any).status || (error as any).response?.status;
      if (
        retryConfig.retryableStatuses &&
        status &&
        !retryConfig.retryableStatuses.includes(status)
      ) {
        throw error;
      }

      // Calculate delay
      const delayMs = calculateBackoffDelay(attempt, retryConfig);

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      console.warn(
        `Retry attempt ${attempt + 1}/${retryConfig.maxAttempts} after ${delayMs}ms`,
        error
      );

      // Wait before retrying
      await delay(delayMs);
    }
  }

  throw lastError;
}

/**
 * Enhanced error handler with categorization and user-friendly messages
 */
export function handleError(
  error: any,
  context?: { route?: string; action?: string; userId?: string }
): CategorizedError {
  const categorized = categorizeError(error);

  // Log error to monitoring service
  logError(categorized.originalError, {
    ...context,
    metadata: {
      category: categorized.category,
      severity: categorized.severity,
      retryable: categorized.retryable,
    },
  });

  return categorized;
}

/**
 * Create a user-friendly error message
 */
export function formatErrorForUser(error: CategorizedError): string {
  let message = categorized.userMessage;

  if (error.actionable) {
    message += `\n\n${error.actionable}`;
  }

  return message;
}
