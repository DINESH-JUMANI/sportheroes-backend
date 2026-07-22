import type { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
  isProfileComplete: boolean;
  /** false for users added via teams/matches until they set a password */
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  expiresAt: string;
}

export interface LoginResult {
  isNewUser: boolean;
  user: PublicUser;
  tokens: AuthTokens;
}

export function toPublicUser(user: User): PublicUser {
  const isPlaceholderName =
    !user.fullName ||
    user.fullName === user.phoneNumber ||
    user.fullName.startsWith('Player ');

  const isProfileComplete = !isPlaceholderName;

  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName,
    displayName: user.displayName,
    profilePictureUrl: user.profilePictureUrl,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
    gender: user.gender,
    city: user.city,
    state: user.state,
    country: user.country,
    isActive: user.isActive,
    isProfileComplete,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
