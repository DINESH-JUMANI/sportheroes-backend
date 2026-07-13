import type { User } from '@prisma/client';
import { config } from '../../config/config';
import {
  DEV_TOKEN_EXPIRY_DAYS,
  DEV_USER_FIREBASE_UID,
  DEV_USER_ID,
} from '../../config/dev.constants';
import { prisma } from '../../config/prisma';
import { getFirebaseAuth } from '../../config/firebase';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { signAccessToken, signAccessTokenWithDays } from '../../utils/jwt';
import { Logger } from '../../utils/logger';
import type { LoginInput, UpdateProfileInput } from './auth.validators';
import { LoginResult, PublicUser, toPublicUser } from './auth.types';

function buildTokens(user: User) {
  const signed = signAccessToken({
    sub: user.id,
    firebaseUid: user.firebaseUid,
    phoneNumber: user.phoneNumber,
  });

  return {
    accessToken: signed.accessToken,
    tokenType: 'Bearer' as const,
    expiresIn: signed.expiresIn,
    expiresAt: signed.expiresAt.toISOString(),
  };
}

function buildDevTokens(user: User) {
  const signed = signAccessTokenWithDays(
    {
      sub: user.id,
      firebaseUid: user.firebaseUid,
      phoneNumber: user.phoneNumber,
    },
    DEV_TOKEN_EXPIRY_DAYS,
  );

  return {
    accessToken: signed.accessToken,
    tokenType: 'Bearer' as const,
    expiresIn: signed.expiresIn,
    expiresAt: signed.expiresAt.toISOString(),
  };
}

function defaultFullName(phoneNumber: string | null | undefined, firebaseUid: string): string {
  if (phoneNumber) return phoneNumber;
  return `Player ${firebaseUid.slice(0, 8)}`;
}

export class AuthService {
  /**
   * Verifies a Firebase ID token (issued after phone OTP on the client),
   * upserts the local user, and returns an app JWT valid for AUTH_TOKEN_EXPIRY_DAYS.
   */
  async loginWithFirebase(input: LoginInput): Promise<LoginResult> {
    Logger.debug('Verifying Firebase ID token');

    let decoded;
    try {
      decoded = await getFirebaseAuth().verifyIdToken(input.idToken);
    } catch (error) {
      Logger.warn('Firebase ID token verification failed', error);
      throw new UnauthorizedError('Invalid or expired Firebase ID token', 'INVALID_FIREBASE_TOKEN');
    }

    const firebaseUid = decoded.uid;
    const phoneNumber = decoded.phone_number ?? null;
    const email = decoded.email ?? null;

    Logger.debug('Firebase token verified', { firebaseUid, phoneNumber });

    if (!phoneNumber && !email) {
      Logger.warn('Firebase token missing phone and email', { firebaseUid });
      throw new BadRequestError(
        'Firebase token must include a phone number (phone auth) or email',
        'MISSING_IDENTITY',
      );
    }

    const existing = await prisma.user.findUnique({ where: { firebaseUid } });

    let user: User;
    let isNewUser = false;

    if (existing) {
      if (!existing.isActive) {
        Logger.warn('Login blocked for deactivated account', { userId: existing.id });
        throw new UnauthorizedError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
      }

      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          phoneNumber: phoneNumber ?? existing.phoneNumber,
          email: email ?? existing.email,
        },
      });
      Logger.info('Existing user logged in', { userId: user.id });
    } else {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          firebaseUid,
          phoneNumber,
          email,
          fullName: defaultFullName(phoneNumber, firebaseUid),
        },
      });
      Logger.info('New user created', { userId: user.id, phoneNumber });
    }

    return {
      isNewUser,
      user: toPublicUser(user),
      tokens: buildTokens(user),
    };
  }

  async getMe(userId: string): Promise<PublicUser> {
    Logger.debug('Fetching current user profile', { userId });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      Logger.warn('User not found for getMe', { userId });
      throw new NotFoundError('User not found');
    }

    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    Logger.debug('Updating user profile', { userId, fields: Object.keys(input) });

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing || !existing.isActive) {
      Logger.warn('User not found for profile update', { userId });
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email !== existing.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email: input.email, NOT: { id: userId } },
      });
      if (emailTaken) {
        Logger.warn('Profile update failed: email already in use', { userId, email: input.email });
        throw new BadRequestError('Email is already in use', 'EMAIL_IN_USE');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.profilePictureUrl !== undefined
          ? { profilePictureUrl: input.profilePictureUrl }
          : {}),
        ...(input.dateOfBirth !== undefined
          ? {
              dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            }
          : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
      },
    });

    Logger.info('User profile updated', { userId: user.id });
    return toPublicUser(user);
  }

  /**
   * Development-only login for the seeded test user. Issues a 1-year JWT.
   * Run `npm run db:seed:dev` first.
   */
  async devLogin(): Promise<LoginResult> {
    if (config.env === 'production') {
      throw new ForbiddenError('Dev login is not available in production', 'DEV_LOGIN_DISABLED');
    }

    const user = await prisma.user.findUnique({ where: { id: DEV_USER_ID } });

    if (!user || user.firebaseUid !== DEV_USER_FIREBASE_UID) {
      throw new NotFoundError(
        'Dev test user not found. Run: npm run db:seed:dev',
        'DEV_USER_NOT_FOUND',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Dev account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    Logger.info('Dev login issued', { userId: user.id, expiryDays: DEV_TOKEN_EXPIRY_DAYS });

    return {
      isNewUser: false,
      user: toPublicUser(user),
      tokens: buildDevTokens(user),
    };
  }
}

export const authService = new AuthService();
