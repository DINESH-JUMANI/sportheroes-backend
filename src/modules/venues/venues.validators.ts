import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const listVenuesQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v !== 'false'),
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(150),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  address: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
});

export const updateVenueSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
    address: z.string().trim().max(255).nullable().optional(),
    city: z.string().trim().max(100).nullable().optional(),
    state: z.string().trim().max(100).nullable().optional(),
    country: z.string().trim().max(100).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
