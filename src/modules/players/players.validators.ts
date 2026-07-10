import { z } from 'zod';

export const saveProfileSchema = z.object({
  sportId: z.string().uuid('sportId must be a valid UUID'),
  isPrimarySport: z.boolean().optional(),
});

export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
