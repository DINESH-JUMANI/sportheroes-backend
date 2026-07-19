import { z } from 'zod';
import { dateTimeStringSchema, paginationSchema } from '../../utils/pagination';

const participantSchema = z
  .object({
    side: z.enum(['A', 'B']),
    userId: z.string().uuid().optional(),
    phoneNumber: z.string().optional(),
    teamId: z.string().uuid().optional(),
    teamName: z.string().optional(),
  })
  .refine(
    (d) => {
      const hasUser = Boolean(d.userId) || Boolean(d.phoneNumber);
      const hasTeam = Boolean(d.teamId) || Boolean(d.teamName);
      return hasUser !== hasTeam;
    },
    {
      message: 'Each participant must have exactly one of user (userId or phoneNumber) or team (teamId or teamName)',
    }
  );

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
