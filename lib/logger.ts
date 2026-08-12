type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie',
  'session', 'jwt', 'refresh_token', 'api_key', 'apikey',
  'private_key', 'access_key',
])

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redact)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]'
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redact(v)
    } else {
      out[k] = v
    }
  }
  return out
}

let correlationIdCounter = 0

function generateCorrelationId(): string {
  correlationIdCounter++
  return `req-${Date.now().toString(36)}-${correlationIdCounter.toString(36)}`
}

export type LoggerOptions = {
  prefix?: string
  level?: LogLevel
  correlationId?: string
}

class Logger {
  private prefix: string
  private level: LogLevel

  constructor(prefix = '', level: LogLevel = 'info') {
    this.prefix = prefix
    this.level = process.env.NODE_ENV === 'production' ? 'warn' : level
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  private log(level: LogLevel, message: string, meta?: unknown, correlationId?: string) {
    if (!this.shouldLog(level)) return
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level: LEVEL_NAMES[level],
      msg: message,
    }
    if (this.prefix) entry.prefix = this.prefix
    if (correlationId) entry.correlationId = correlationId
    if (meta !== undefined) entry.meta = redact(meta)
    console.log(JSON.stringify(entry))
  }

  debug(message: string, meta?: unknown, correlationId?: string) { this.log('debug', message, meta, correlationId) }
  info(message: string, meta?: unknown, correlationId?: string) { this.log('info', message, meta, correlationId) }
  warn(message: string, meta?: unknown, correlationId?: string) { this.log('warn', message, meta, correlationId) }
  error(message: string, meta?: unknown, correlationId?: string) { this.log('error', message, meta, correlationId) }
}

export const logger = new Logger('aerojet')

export function createLogger(prefix: string, level: LogLevel = 'info'): Logger {
  return new Logger(prefix, level)
}

export function withCorrelationId<T extends (...args: any[]) => any>(fn: T, correlationId?: string): T {
  const id = correlationId || generateCorrelationId()
  return ((..._args: any[]) => fn(..._args, id)) as T
}

export { generateCorrelationId }
