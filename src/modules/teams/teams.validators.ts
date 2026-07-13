import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listTeamsQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid().optional(),
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const createTeamSchema = z.object({
  sportId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  shortName: z.string().trim().max(10).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const updateTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    shortName: z.string().trim().max(10).nullable().optional(),
    logoUrl: z.string().url().nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    captainId: z.string().uuid().nullable().optional(),
    viceCaptainId: z.string().uuid().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['captain', 'vice_captain', 'member']).default('member'),
});

export const updateMemberSchema = z.object({
  role: z.enum(['captain', 'vice_captain', 'member']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
