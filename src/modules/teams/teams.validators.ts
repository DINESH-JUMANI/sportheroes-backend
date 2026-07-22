import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import { normalizePhoneNumber } from '../../utils/phone';

const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .transform((v) => normalizePhoneNumber(v));

export const listTeamsQuerySchema = paginationSchema.extend({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  shortName: z.string().trim().max(10).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const updateTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    shortName: z.string().trim().max(10).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    /** Set null to clear logo. Prefer PUT /teams/:id/logo multipart upload. */
    logoUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

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
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
