import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const playerLeaderboardQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid(),
  sortBy: z.enum(['ranking_points', 'win_percentage', 'matches_played']).default('ranking_points'),
});

export const teamLeaderboardQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid().optional(),
  sortBy: z.enum(['win_percentage', 'matches_played']).default('win_percentage'),
});

export const playerStatsParamSchema = z.object({
  userId: z.string().uuid(),
});

export const playerStatsQuerySchema = z.object({
  sportId: z.string().uuid().optional(),
});

export const teamStatsParamSchema = z.object({
  teamId: z.string().uuid(),
});
