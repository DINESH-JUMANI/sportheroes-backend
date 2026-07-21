import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const imageMimeTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ticketImageSchema = z.object({
  imageBase64: z.string().min(1).max(7_000_000),
  mimeType: imageMimeTypeSchema,
});

export const listConcernsQuerySchema = paginationSchema.extend({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? true : v === 'true')),
});

export const createConcernSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, 'code must be lowercase letters, numbers, underscores')
    .transform((v) => v.toLowerCase()),
  label: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isOther: z.boolean().optional(),
});

export const updateConcernSchema = z.object({
  label: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isOther: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createTicketSchema = z
  .object({
    concernId: z.string().uuid(),
    /** Required when the selected concern has isOther=true */
    otherConcernText: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().min(10).max(5000),
    images: z.array(ticketImageSchema).max(5).optional(),
  })
  .strict();

export const listTicketsQuerySchema = paginationSchema.extend({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  /** If true, only tickets created by the current user (default true for FE). */
  mineOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? true : v === 'true')),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  note: z.string().trim().max(500).optional(),
});

export const ticketNumberParamSchema = z.object({
  ticketNumber: z.string().trim().min(3).max(30),
});

export type CreateConcernInput = z.infer<typeof createConcernSchema>;
export type UpdateConcernInput = z.infer<typeof updateConcernSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
