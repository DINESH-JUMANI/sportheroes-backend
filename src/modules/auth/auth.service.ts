import type { User } from '@prisma/client';
import { config } from '../../config/config';
import {
  DEV_TOKEN_EXPIRY_DAYS,
  DEV_USER_AUTH_UID,
  DEV_USER_ID,
  DEV_USER_PASSWORD,
} from '../../config/dev.constants';
import { prisma } from '../../config/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { signAccessToken, signAccessTokenWithDays } from '../../utils/jwt';
import { Logger } from '../../utils/logger';
import { hashPassword, verifyPassword } from '../../utils/password';
import { localAuthUid, normalizePhoneNumber } from '../../utils/phone';
import { extensionForMime, uploadToSupabase } from '../../utils/storage';
import { findUserByEmailOrPhone } from '../../utils/user-resolver';
import { ensureUserLinkedToAllSports } from '../../utils/user-sports';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SetPasswordInput,
  UpdateProfileInput,
} from './auth.validators';
import { LoginResult, PublicUser, toPublicUser } from './auth.types';

function buildTokens(user: User) {
  const signed = signAccessToken({
    sub: user.id,
    phoneNumber: user.phoneNumber,
    email: user.email,
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
      phoneNumber: user.phoneNumber,
      email: user.email,
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

export class AuthService {
  async register(input: RegisterInput): Promise<LoginResult> {
    const email = input.email ?? null;
    const phoneNumber = input.phoneNumber ?? null;

    if (email) {
      const taken = await prisma.user.findFirst({ where: { email, isActive: true } });
      if (taken) throw new ConflictError('Email is already registered', 'EMAIL_IN_USE');
    }
    if (phoneNumber) {
      const taken = await prisma.user.findFirst({ where: { phoneNumber, isActive: true } });
      if (taken) {
        if (!taken.passwordHash) {
          throw new BadRequestError(
            'An account exists for this phone without a password. Use POST /auth/set-password.',
            'PASSWORD_NOT_SET',
          );
        }
        throw new ConflictError('Phone number is already registered', 'PHONE_IN_USE');
      }
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        authUid: localAuthUid(),
        email,
        phoneNumber,
        fullName: input.fullName,
        passwordHash,
      },
    });

    await ensureUserLinkedToAllSports(user.id);
    Logger.info('User registered', { userId: user.id });

    return {
      isNewUser: true,
      user: toPublicUser(user),
      tokens: buildTokens(user),
    };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await findUserByEmailOrPhone({
      email: input.email,
      phoneNumber: input.phoneNumber,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.passwordHash) {
      throw new BadRequestError(
        'Password is not set for this account. Use POST /auth/set-password to create one.',
        'PASSWORD_NOT_SET',
      );
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    await ensureUserLinkedToAllSports(user.id);
    Logger.info('User logged in', { userId: user.id });

    return {
      isNewUser: false,
      user: toPublicUser(user),
      tokens: buildTokens(user),
    };
  }

  /**
   * For placeholder users (added via teams/matches) who have no password yet.
   * Sets password and returns JWT so they can use the app.
   */
  async setPassword(input: SetPasswordInput): Promise<LoginResult> {
    const user = await findUserByEmailOrPhone({
      email: input.email,
      phoneNumber: input.phoneNumber,
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('No account found for this email/phone', 'USER_NOT_FOUND');
    }

    if (user.passwordHash) {
      throw new BadRequestError(
        'Password already set. Use POST /auth/login or POST /auth/reset-password.',
        'PASSWORD_ALREADY_SET',
      );
    }

    const passwordHash = await hashPassword(input.password);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        ...(input.fullName ? { fullName: input.fullName } : {}),
        authUid: user.authUid.startsWith('pending_phone_') ? localAuthUid() : user.authUid,
      },
    });

    await ensureUserLinkedToAllSports(updated.id);
    Logger.info('Password set for user', { userId: updated.id });

    return {
      isNewUser: false,
      user: toPublicUser(updated),
      tokens: buildTokens(updated),
    };
  }

  /** Reset password when current password is known (no OTP / email link). */
  async resetPassword(input: ResetPasswordInput): Promise<LoginResult> {
    const user = await findUserByEmailOrPhone({
      email: input.email,
      phoneNumber: input.phoneNumber,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.passwordHash) {
      throw new BadRequestError(
        'Password is not set. Use POST /auth/set-password instead.',
        'PASSWORD_NOT_SET',
      );
    }

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    const passwordHash = await hashPassword(input.newPassword);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    Logger.info('Password reset', { userId: updated.id });
    return {
      isNewUser: false,
      user: toPublicUser(updated),
      tokens: buildTokens(updated),
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundError('User not found');
    if (!user.passwordHash) {
      throw new BadRequestError('Password is not set. Use POST /auth/set-password.', 'PASSWORD_NOT_SET');
    }

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    const passwordHash = await hashPassword(input.newPassword);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    Logger.info('Password changed', { userId });
    return toPublicUser(updated);
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundError('User not found');
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing || !existing.isActive) throw new NotFoundError('User not found');

    if (input.email && input.email !== existing.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email: input.email.toLowerCase(), NOT: { id: userId } },
      });
      if (emailTaken) throw new BadRequestError('Email is already in use', 'EMAIL_IN_USE');
    }

    if (input.phoneNumber !== undefined && input.phoneNumber !== existing.phoneNumber) {
      if (input.phoneNumber) {
        const phoneTaken = await prisma.user.findFirst({
          where: { phoneNumber: input.phoneNumber, isActive: true, NOT: { id: userId } },
        });
        if (phoneTaken) throw new BadRequestError('Phone number is already in use', 'PHONE_IN_USE');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.email !== undefined
          ? { email: input.email ? input.email.toLowerCase() : null }
          : {}),
        ...(input.phoneNumber !== undefined
          ? {
              phoneNumber: input.phoneNumber
                ? normalizePhoneNumber(input.phoneNumber)
                : null,
            }
          : {}),
        ...(input.profilePictureUrl !== undefined
          ? { profilePictureUrl: input.profilePictureUrl }
          : {}),
        ...(input.dateOfBirth !== undefined
          ? { dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null }
          : {}),
        ...(input.gender !== undefined ? { gender: input.gender } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
      },
    });

    Logger.info('Profile updated', { userId });
    return toPublicUser(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<PublicUser> {
    const path = `users/${userId}/avatar.${extensionForMime(file.mimetype)}`;
    const url = await uploadToSupabase({
      bucket: 'avatars',
      path,
      buffer: file.buffer,
      contentType: file.mimetype,
      upsert: true,
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePictureUrl: url },
    });

    Logger.info('Avatar uploaded', { userId });
    return toPublicUser(user);
  }

  async logout(): Promise<void> {
    // Stateless JWT — client discards token
  }

  async devLogin(): Promise<LoginResult> {
    if (config.env === 'production') {
      throw new ForbiddenError('Dev login is not available in production', 'DEV_LOGIN_DISABLED');
    }

    let user = await prisma.user.findUnique({ where: { id: DEV_USER_ID } });

    if (!user || user.authUid !== DEV_USER_AUTH_UID) {
      throw new NotFoundError(
        'Dev test user not found. Run: npm run db:seed:dev',
        'DEV_USER_NOT_FOUND',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Dev account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    if (!user.passwordHash) {
      const passwordHash = await hashPassword(DEV_USER_PASSWORD);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    await ensureUserLinkedToAllSports(user.id);
    Logger.info('Dev login issued', { userId: user.id, expiryDays: DEV_TOKEN_EXPIRY_DAYS });

    return {
      isNewUser: false,
      user: toPublicUser(user),
      tokens: buildDevTokens(user),
    };
  }
}

export const authService = new AuthService();
