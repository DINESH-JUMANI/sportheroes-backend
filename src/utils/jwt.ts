import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UnauthorizedError } from './errors';
import { Logger } from './logger';

export interface JwtPayload {
  sub: string;
  firebaseUid: string;
  phoneNumber?: string | null;
}

export interface SignedToken {
  accessToken: string;
  expiresIn: string;
  expiresAt: Date;
}

export function signAccessToken(payload: JwtPayload): SignedToken {
  const expiresInSeconds = config.auth.tokenExpiryDays * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const accessToken = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: expiresInSeconds,
    issuer: config.auth.jwtIssuer,
  });

  Logger.debug('Access token signed', {
    userId: payload.sub,
    expiresIn: `${config.auth.tokenExpiryDays}d`,
  });

  return {
    accessToken,
    expiresIn: `${config.auth.tokenExpiryDays}d`,
    expiresAt,
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      issuer: config.auth.jwtIssuer,
    });

    if (typeof decoded === 'string' || !decoded.sub) {
      Logger.debug('Access token invalid: missing subject');
      throw new UnauthorizedError('Invalid access token');
    }

    return {
      sub: decoded.sub,
      firebaseUid: (decoded as JwtPayload).firebaseUid,
      phoneNumber: (decoded as JwtPayload).phoneNumber,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    Logger.debug('Access token verification failed', error);
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
