import { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';
import { Logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenPayload?: {
        sub: string;
        firebaseUid: string;
        phoneNumber?: string | null;
      };
    }
  }
}

/**
 * Requires a valid Bearer access token and attaches the user to the request.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      Logger.debug('Auth failed: missing or invalid Authorization header');
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      Logger.debug('Auth failed: empty access token');
      throw new UnauthorizedError('Missing access token');
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      Logger.warn('Auth failed: user not found for token', { userId: payload.sub });
      throw new UnauthorizedError('User not found for this token');
    }

    if (!user.isActive) {
      Logger.warn('Auth failed: account deactivated', { userId: user.id });
      throw new ForbiddenError('Account is deactivated');
    }

    req.tokenPayload = payload;
    req.user = user;
    Logger.debug('Authenticated user', { userId: user.id });
    next();
  } catch (error) {
    next(error);
  }
}
