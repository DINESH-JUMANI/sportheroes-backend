import { z } from 'zod';
import { dateTimeStringSchema, paginationSchema } from '../../utils/pagination';
import { normalizePhoneNumber } from '../../utils/phone';

const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .transform((v) => normalizePhoneNumber(v));

const participantSchema = z
  .object({
    side: z.enum(['A', 'B']),
    phoneNumber: phoneSchema.optional(),
    fullName: z.string().trim().min(1).max(150).optional(),
    teamId: z.string().uuid().optional(),
  })
  .refine((d) => Boolean(d.phoneNumber) !== Boolean(d.teamId), {
    message: 'Each participant must have exactly one of phoneNumber or teamId',
  });

export const listMatchesQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid().optional(),
  sportCode: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((v) => v.toUpperCase())
    .optional(),
  tournamentId: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'ongoing', 'paused', 'completed', 'cancelled']).optional(),
  createdBy: z.string().uuid().optional(),
  participantPhone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .transform((v) => normalizePhoneNumber(v))
    .optional(),
});

export const createMatchSchema = z
  .object({
    sportCode: z
      .string()
      .trim()
      .min(2)
      .max(10)
      .transform((v) => v.toUpperCase())
      .optional(),
    sportId: z.string().uuid().optional(),
    tournamentId: z.string().uuid().nullable().optional(),
    tournamentRoundId: z.string().uuid().nullable().optional(),
    matchType: z.enum(['singles', 'doubles', 'team']),
    /** Best-of sets (1–5). Sets matchFormat.best_of_sets and sets_to_win = ceil(n/2). */
    bestOfSets: z.number().int().min(1).max(5),
    venueId: z.string().uuid().nullable().optional(),
    venue: z.string().max(200).nullable().optional(),
    scheduledAt: dateTimeStringSchema.nullable().optional(),
    participants: z.array(participantSchema).min(2),
  })
  .refine((d) => d.sportCode || d.sportId, {
    message: 'Either sportCode or sportId is required',
    path: ['sportCode'],
  });

export const recordPointSchema = z.object({
  scoringSide: z.enum(['A', 'B']),
});

export const finishSetSchema = z.object({
  /** Optional when scores are unequal; required if scores are tied. */
  winnerSide: z.enum(['A', 'B']).optional(),
});

export const cancelMatchSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const completeMatchSchema = z.object({
  winnerSide: z.enum(['A', 'B']).optional(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type RecordPointInput = z.infer<typeof recordPointSchema>;
export type FinishSetInput = z.infer<typeof finishSetSchema>;
export type CompleteMatchInput = z.infer<typeof completeMatchSchema>;
