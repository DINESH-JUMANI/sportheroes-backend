import { z } from 'zod';
import { dateStringSchema, paginationSchema } from '../../utils/pagination';
import { normalizePhoneNumber } from '../../utils/phone';

export const listTournamentsQuerySchema = paginationSchema.extend({
  sportId: z.string().uuid().optional(),
  status: z
    .enum([
      'draft',
      'registration_open',
      'registration_closed',
      'ongoing',
      'completed',
      'cancelled',
    ])
    .optional(),
});

export const createTournamentSchema = z.object({
  sportId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  format: z.enum(['league', 'round_robin', 'knockout']),
  participantKind: z.enum(['individual', 'team']),
  bannerUrl: z.string().url().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  registrationStartDate: dateStringSchema.nullable().optional(),
  registrationEndDate: dateStringSchema.nullable().optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema.nullable().optional(),
  maxParticipants: z.number().int().min(2).nullable().optional(),
});

export const updateTournamentSchema = createTournamentSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export const updateTournamentStatusSchema = z.object({
  status: z.enum([
    'draft',
    'registration_open',
    'registration_closed',
    'ongoing',
    'completed',
    'cancelled',
  ]),
});

export const registerParticipantSchema = z
  .object({
    phoneNumber: z
      .string()
      .trim()
      .min(8)
      .max(20)
      .transform((v) => normalizePhoneNumber(v))
      .optional(),
    fullName: z.string().trim().min(1).max(150).optional(),
    teamId: z.string().uuid().optional(),
    seedNumber: z.number().int().min(1).optional(),
  })
  .refine((d) => Boolean(d.phoneNumber) !== Boolean(d.teamId), {
    message: 'Provide exactly one of phoneNumber or teamId',
  });

export const updateParticipantSchema = z.object({
  status: z.enum(['registered', 'confirmed', 'withdrawn', 'disqualified']).optional(),
  seedNumber: z.number().int().min(1).nullable().optional(),
});

export const createRoundSchema = z.object({
  roundNumber: z.number().int().min(1),
  roundName: z.string().trim().min(1).max(50),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
export type RegisterParticipantInput = z.infer<typeof registerParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type CreateRoundInput = z.infer<typeof createRoundSchema>;
