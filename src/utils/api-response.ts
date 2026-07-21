import { Response } from 'express';

/**
 * Unified API envelope for FE modals:
 *   { success: boolean, message: string, data: T | null, error?: { code, details? } }
 */
export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
