import { z } from 'zod';
import { dateTimeStringSchema, paginationSchema } from '../../utils/pagination';

const participantSchema = z
  .object({
    side: z.enum(['A', 'B']),
    userId: z.string().uuid().optional(),
    teamId: z.string().uuid().optional(),
  })
  .refine((d) => Boolean(d.userId) !== Boolean(d.teamId), {
    message: 'Each participant must have exactly one of userId or teamId',
  });

export const listMatchesQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'ongoing', 'paused', 'completed', 'cancelled']).optional(),
  createdBy: z.string().uuid().optional(),
});

export const createMatchSchema = z.object({
  sportId: z.string().uuid(),
  tournamentId: z.string().uuid().nullable().optional(),
  tournamentRoundId: z.string().uuid().nullable().optional(),
  matchType: z.enum(['singles', 'doubles', 'team']),
  venue: z.string().max(200).nullable().optional(),
  scheduledAt: dateTimeStringSchema.nullable().optional(),
  participants: z.array(participantSchema).min(2),
});

export const recordPointSchema = z.object({
  scoringSide: z.enum(['A', 'B']),
  pointType: z.enum(['normal', 'service_fault', 'let']).optional(),
});

export const cancelMatchSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type RecordPointInput = z.infer<typeof recordPointSchema>;
