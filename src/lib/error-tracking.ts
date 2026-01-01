// src/lib/error-tracking.ts
// Error tracking and reporting utility
// Ready for Sentry integration - install @sentry/nextjs and configure to enable

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  userId?: string
  organizationId?: string
  endpoint?: string
  action?: string
  extra?: Record<string, unknown>
}

// Sentry-like interface (minimal for our usage)
interface SentryScope {
  setLevel(level: ErrorSeverity): void
  setUser(user: { id: string; email?: string } | null): void
  setTag(key: string, value: string): void
  setExtras(extras: Record<string, unknown>): void
}

interface SentryLike {
  withScope(callback: (scope: SentryScope) => void): void
  captureException(error: Error): void
  captureMessage(message: string, level: ErrorSeverity): void
  setUser(user: { id: string; email?: string } | null): void
  setTag(key: string, value: string): void
}

/**
 * Check if Sentry is available
 */
function getSentry(): SentryLike | null {
  try {
    // Dynamic import to avoid errors if @sentry/nextjs is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentry = require('@sentry/nextjs')
    if (sentry && typeof sentry.captureException === 'function') {
      return sentry as SentryLike
    }
    return null
  } catch {
    return null
  }
}

/**
 * Capture an exception and report it to error tracking service
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  const Sentry = getSentry()

  // Always log to console in development or if Sentry unavailable
  if (process.env.NODE_ENV === 'development' || !Sentry) {
    console.error('[Error]', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      severity,
      context,
    })
    return
  }

  // Report to Sentry if available
  Sentry.withScope((scope) => {
    scope.setLevel(severity)

    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }
    if (context?.organizationId) {
      scope.setTag('organizationId', context.organizationId)
    }
    if (context?.endpoint) {
      scope.setTag('endpoint', context.endpoint)
    }
    if (context?.action) {
      scope.setTag('action', context.action)
    }
    if (context?.extra) {
      scope.setExtras(context.extra)
    }

    if (error instanceof Error) {
      Sentry.captureException(error)
    } else {
      Sentry.captureMessage(String(error), severity)
    }
  })
}

/**
 * Capture a message/event
 */
export function captureMessage(
  message: string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'info'
): void {
  const Sentry = getSentry()

  if (process.env.NODE_ENV === 'development' || !Sentry) {
    console.log(`[${severity.toUpperCase()}]`, message, context)
    return
  }

  Sentry.withScope((scope) => {
    scope.setLevel(severity)

    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }
    if (context?.organizationId) {
      scope.setTag('organizationId', context.organizationId)
    }
    if (context?.extra) {
      scope.setExtras(context.extra)
    }

    Sentry.captureMessage(message, severity)
  })
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string, email?: string, organizationId?: string): void {
  const Sentry = getSentry()

  if (Sentry) {
    Sentry.setUser({
      id: userId,
      email,
    })
    if (organizationId) {
      Sentry.setTag('organizationId', organizationId)
    }
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  const Sentry = getSentry()

  if (Sentry) {
    Sentry.setUser(null)
  }
}

/*
 * SENTRY SETUP INSTRUCTIONS
 * =========================
 *
 * 1. Install Sentry:
 *    npm install @sentry/nextjs
 *
 * 2. Run Sentry wizard:
 *    npx @sentry/wizard@latest -i nextjs
 *
 * 3. Add to .env:
 *    SENTRY_DSN=your-dsn-here
 *    SENTRY_AUTH_TOKEN=your-auth-token
 *
 * 4. The wizard will create:
 *    - sentry.client.config.ts
 *    - sentry.server.config.ts
 *    - sentry.edge.config.ts
 *    - next.config.mjs updates
 *
 * 5. This error-tracking.ts will automatically detect and use Sentry
 *    once installed, no code changes needed.
 */
