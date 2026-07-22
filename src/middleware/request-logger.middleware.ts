import { NextFunction, Request, Response } from 'express';
import { Logger } from '../utils/logger';

/**
 * Logs every incoming API request and its response status/duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  Logger.http(`→ ${method} ${originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: sanitizeBody(req.body),
    query: req.query,
  });

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const message = `← ${method} ${originalUrl} ${res.statusCode} ${durationMs}ms`;

    if (res.statusCode >= 500) {
      Logger.error(message);
      return;
    }

    if (res.statusCode >= 400) {
      Logger.warn(message);
      return;
    }

    Logger.http(message);
  });

  next();
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;

  const clone = { ...(body as Record<string, unknown>) };
  for (const key of ['idToken', 'password', 'currentPassword', 'newPassword', 'token', 'accessToken', 'authorization']) {
    if (key in clone) {
      clone[key] = '[REDACTED]';
    }
  }
  return clone;
}
