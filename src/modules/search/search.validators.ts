import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const searchQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100),
  types: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return ['users', 'teams', 'tournaments', 'matches', 'venues'] as const;
      return v.split(',').map((t) => t.trim().toLowerCase()) as (
        | 'users'
        | 'teams'
        | 'tournaments'
        | 'matches'
        | 'venues'
      )[];
    }),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
