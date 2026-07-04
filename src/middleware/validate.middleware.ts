import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates a request part against a Zod schema and replaces it with the parsed value.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      next(new BadRequestError('Validation failed', 'VALIDATION_ERROR', details));
      return;
    }

    req[part] = result.data;
    next();
  };
}
