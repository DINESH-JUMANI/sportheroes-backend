import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { Logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  Logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    Logger.warn(`${req.method} ${req.originalUrl} → ${err.statusCode} ${err.code}`, {
      message: err.message,
      details: err.details,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  Logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
