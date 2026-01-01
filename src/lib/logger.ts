// src/lib/logger.ts
// Structured logging utility for consistent error tracking

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  route?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

/**
 * Format a log entry as JSON for structured logging
 */
function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Get the appropriate console method for a log level
 */
function getConsoleMethod(level: LogLevel): typeof console.log {
  switch (level) {
    case 'debug':
      return console.debug;
    case 'info':
      return console.info;
    case 'warn':
      return console.warn;
    case 'error':
      return console.error;
    default:
      return console.log;
  }
}

/**
 * Create a structured log entry
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  const consoleMethod = getConsoleMethod(level);

  // In development, log in a more readable format
  if (process.env.NODE_ENV === 'development') {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    if (error) {
      consoleMethod(prefix, message, context || '', error);
    } else {
      consoleMethod(prefix, message, context || '');
    }
  } else {
    // In production, use JSON for structured logging (compatible with Cloud Logging)
    consoleMethod(formatLog(entry));
  }
}

/**
 * Logger interface with methods for each log level
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error) => log('error', message, context, error),
};

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      log('debug', message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      log('info', message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext, error?: Error) =>
      log('warn', message, { ...baseContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: Error) =>
      log('error', message, { ...baseContext, ...context }, error),
  };
}

/**
 * Log an API route error with standard context
 */
export function logApiError(
  route: string,
  error: unknown,
  context?: Omit<LogContext, 'route'>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(`API Error: ${route}`, { route, ...context }, err);
}

/**
 * Measure and log execution time
 */
export function createTimer(label: string, context?: LogContext): () => void {
  const start = performance.now();
  return () => {
    const duration = Math.round(performance.now() - start);
    logger.info(`${label} completed`, { ...context, duration });
  };
}
