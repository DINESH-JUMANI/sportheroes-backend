import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { Logger } from '../utils/logger';

/** Unified error envelope — same top-level keys as success (`success`, `message`, `data`). */
function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  Logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  sendError(res, 404, 'The requested endpoint does not exist', 'ROUTE_NOT_FOUND');
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    Logger.warn(`${req.method} ${req.originalUrl} → ${err.statusCode} ${err.code}`, {
      message: err.message,
      details: err.details,
    });

    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  Logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  sendError(res, 500, 'An unexpected error occurred', 'INTERNAL_SERVER_ERROR');
}
