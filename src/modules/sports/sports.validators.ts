import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listSportsQuerySchema = paginationSchema.extend({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const sportCodeParamSchema = z.object({
  code: z.string().min(1).max(10),
});

export const createPlayerProfileSchema = z.object({
  sportId: z.string().uuid('Invalid sportId'),
  skillLevel: z
    .enum(['beginner', 'intermediate', 'advanced', 'professional'])
    .default('beginner'),
  isPrimarySport: z.boolean().optional().default(false),
});

export const updatePlayerProfileSchema = z
  .object({
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
    isPrimarySport: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid userId'),
});

export type CreatePlayerProfileInput = z.infer<typeof createPlayerProfileSchema>;
export type UpdatePlayerProfileInput = z.infer<typeof updatePlayerProfileSchema>;
