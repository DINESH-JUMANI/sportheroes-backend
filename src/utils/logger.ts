type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  http: '\x1b[35m',
  debug: '\x1b[90m',
};

const RESET = '\x1b[0m';

function resolveLevel(): LogLevel {
  const fromEnv = (process.env.LOG_LEVEL ?? 'debug').toLowerCase() as LogLevel;
  return fromEnv in LOG_LEVELS ? fromEnv : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[resolveLevel()];
}

function formatMeta(meta?: unknown): string {
  if (meta === undefined || meta === null) return '';
  if (meta instanceof Error) {
    return ` ${meta.message}${meta.stack ? `\n${meta.stack}` : ''}`;
  }
  if (typeof meta === 'string') return ` ${meta}`;
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level];
  const label = level.toUpperCase().padEnd(5);
  const line = `${color}[${timestamp}] ${label}${RESET} ${message}${formatMeta(meta)}`;

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

/**
 * Application logger with level-based filtering via LOG_LEVEL env.
 * Levels (low → high verbosity): error | warn | info | http | debug
 */
export const Logger = {
  error(message: string, meta?: unknown): void {
    write('error', message, meta);
  },

  warn(message: string, meta?: unknown): void {
    write('warn', message, meta);
  },

  info(message: string, meta?: unknown): void {
    write('info', message, meta);
  },

  http(message: string, meta?: unknown): void {
    write('http', message, meta);
  },

  debug(message: string, meta?: unknown): void {
    write('debug', message, meta);
  },
};
