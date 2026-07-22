import { z } from 'zod';
import { normalizePhoneNumber } from '../../utils/phone';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .transform((v) => normalizePhoneNumber(v));

const emailSchema = z.string().trim().email().max(255).transform((v) => v.toLowerCase());

export const registerSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    password: passwordSchema,
    fullName: z.string().trim().min(2).max(150),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phoneNumber), {
    message: 'Either email or phoneNumber is required',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phoneNumber), {
    message: 'Either email or phoneNumber is required',
    path: ['email'],
  });

/** Public account probe for login step 1 (exists + has password). */
export const checkAccountSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phoneNumber), {
    message: 'Either email or phoneNumber is required',
    path: ['email'],
  });

/** First-time password for users created via teams/matches (passwordHash is null). */
export const setPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    password: passwordSchema,
    fullName: z.string().trim().min(2).max(150).optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phoneNumber), {
    message: 'Either email or phoneNumber is required',
    path: ['email'],
  });

/** Reset password when you already know the current password (no OTP). */
export const resetPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    phoneNumber: phoneSchema.optional(),
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phoneNumber), {
    message: 'Either email or phoneNumber is required',
    path: ['email'],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'fullName must be at least 2 characters')
      .max(150, 'fullName must be at most 150 characters')
      .optional(),
    displayName: z
      .string()
      .trim()
      .min(2, 'displayName must be at least 2 characters')
      .max(50, 'displayName must be at most 50 characters')
      .nullable()
      .optional(),
    email: z.string().trim().email('Invalid email address').max(255).nullable().optional(),
    phoneNumber: phoneSchema.nullable().optional(),
    profilePictureUrl: z.string().url('Invalid profile picture URL').nullable().optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD')
      .nullable()
      .optional(),
    gender: z
      .enum(['male', 'female', 'other', 'prefer_not_to_say'], {
        errorMap: () => ({ message: 'Invalid gender value' }),
      })
      .nullable()
      .optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    country: z.string().trim().max(100).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckAccountInput = z.infer<typeof checkAccountSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
