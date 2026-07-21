import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import { normalizePhoneNumber } from '../../utils/phone';

const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .transform((v) => normalizePhoneNumber(v));

const logoBase64Schema = z.string().min(1).max(5_000_000);

const logoMimeTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const listTeamsQuerySchema = paginationSchema.extend({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const createTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    shortName: z.string().trim().max(10).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    logoBase64: logoBase64Schema.optional(),
    logoMimeType: logoMimeTypeSchema.optional(),
  })
  .refine(
    (d) => !d.logoBase64 || d.logoMimeType,
    { message: 'logoMimeType is required when logoBase64 is provided', path: ['logoMimeType'] },
  );

export const updateTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    shortName: z.string().trim().max(10).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    logoBase64: logoBase64Schema.nullable().optional(),
    logoMimeType: logoMimeTypeSchema.nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' })
  .refine(
    (d) => d.logoBase64 === undefined || (d.logoBase64 === null ? true : !!d.logoMimeType),
    { message: 'logoMimeType is required when logoBase64 is provided', path: ['logoMimeType'] },
  );

export const uploadTeamLogoSchema = z.object({
  logoBase64: logoBase64Schema,
  logoMimeType: logoMimeTypeSchema,
});

export const addMemberSchema = z.object({
  phoneNumber: phoneSchema,
  fullName: z.string().trim().min(1).max(150).optional(),
  role: z.enum(['admin', 'captain', 'vice_captain', 'member']).default('member'),
});

export const updateMemberSchema = z
  .object({
    role: z.enum(['admin', 'captain', 'vice_captain', 'member']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const lookupUserQuerySchema = z.object({
  phoneNumber: phoneSchema,
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type UploadTeamLogoInput = z.infer<typeof uploadTeamLogoSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
