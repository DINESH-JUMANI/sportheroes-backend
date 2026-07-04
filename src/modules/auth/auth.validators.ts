import { z } from 'zod';

export const loginSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
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

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
