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

/** Typeahead for match/team participant pickers — name, phone, or email. */
export const searchUsersQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchUsersQuery = z.infer<typeof searchUsersQuerySchema>;
