import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const matchFormatSchema = z.object({
  sets_to_win: z.number().int().min(1),
  best_of_sets: z.number().int().min(1),
  points_per_set: z.number().int().min(1),
  win_by_margin: z.number().int().min(1),
  deuce_enabled: z.boolean().optional(),
  deciding_set_points: z.number().int().min(1).optional(),
});

export const listSportsQuerySchema = paginationSchema.extend({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const sportCodeParamSchema = z.object({
  code: z.string().min(1).max(10),
});

export const createSportSchema = z.object({
  name: z.string().trim().min(2).max(50),
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((v) => v.toUpperCase()),
  iconUrl: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  isTeamSport: z.boolean().optional().default(false),
  defaultMatchFormat: matchFormatSchema,
  isActive: z.boolean().optional().default(true),
});

export const updateSportSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(10)
      .transform((v) => v.toUpperCase())
      .optional(),
    iconUrl: z.string().url().nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    isTeamSport: z.boolean().optional(),
    defaultMatchFormat: matchFormatSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateSportInput = z.infer<typeof createSportSchema>;
export type UpdateSportInput = z.infer<typeof updateSportSchema>;
