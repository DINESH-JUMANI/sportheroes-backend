import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function getPagination(input: PaginationInput) {
  const skip = (input.page - 1) * input.limit;
  return { skip, take: input.limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const dateTimeStringSchema = z.string().datetime({ message: 'Invalid ISO datetime' });
