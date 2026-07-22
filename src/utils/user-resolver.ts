import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError } from './errors';
import { normalizePhoneNumber, placeholderAuthUid } from './phone';
import { ensureUserLinkedToAllSports } from './user-sports';

export interface ResolveUserByPhoneInput {
  phoneNumber: string;
  fullName?: string;
}

/**
 * Find an active user by phone, or create a placeholder user when fullName is provided.
 * Placeholder users have no password until they call POST /auth/set-password.
 */
export async function findOrCreateUserByPhone(input: ResolveUserByPhoneInput): Promise<User> {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  if (!phoneNumber || phoneNumber.length < 8) {
    throw new BadRequestError('Invalid phone number', 'INVALID_PHONE');
  }

  const existing = await prisma.user.findFirst({
    where: { phoneNumber, isActive: true },
  });
  if (existing) return existing;

  if (!input.fullName?.trim()) {
    throw new BadRequestError(
      'User not found. Provide fullName to add a new member by phone number.',
      'USER_NOT_FOUND',
    );
  }

  const user = await prisma.user.create({
    data: {
      authUid: placeholderAuthUid(phoneNumber),
      phoneNumber,
      fullName: input.fullName.trim(),
      passwordHash: null,
    },
  });

  await ensureUserLinkedToAllSports(user.id);
  return user;
}

export async function findUserByPhone(phoneNumber: string): Promise<User | null> {
  const normalized = normalizePhoneNumber(phoneNumber);
  return prisma.user.findFirst({
    where: { phoneNumber: normalized, isActive: true },
  });
}

/** Resolve phone → user id. Creates placeholder when fullName is provided and user is missing. */
export async function resolveUserIdByPhone(
  phoneNumber: string,
  fullName?: string,
): Promise<string> {
  const user = await findOrCreateUserByPhone({ phoneNumber, fullName });
  return user.id;
}

export async function findUserByEmailOrPhone(params: {
  email?: string | null;
  phoneNumber?: string | null;
}): Promise<User | null> {
  if (params.email) {
    const byEmail = await prisma.user.findFirst({
      where: { email: params.email.trim().toLowerCase(), isActive: true },
    });
    if (byEmail) return byEmail;
  }
  if (params.phoneNumber) {
    return findUserByPhone(params.phoneNumber);
  }
  return null;
}
