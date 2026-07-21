import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type { CreateVenueInput, UpdateVenueInput } from './venues.validators';
import { toPublicVenue } from './venues.types';

export class VenuesService {
  async create(userId: string, input: CreateVenueInput) {
    const venue = await prisma.venue.create({
      data: {
        name: input.name,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? null,
        createdBy: userId,
      },
    });

    Logger.info('Venue created', { venueId: venue.id, userId });
    return toPublicVenue(venue);
  }

  async list(page: number, limit: number, q?: string, activeOnly = true) {
    const { skip, take } = getPagination({ page, limit });
    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { address: { contains: q, mode: 'insensitive' as const } },
              { city: { contains: q, mode: 'insensitive' as const } },
              { state: { contains: q, mode: 'insensitive' as const } },
              { country: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.venue.count({ where }),
    ]);

    return {
      venues: venues.map(toPublicVenue),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const venue = await prisma.venue.findUnique({ where: { id } });
    if (!venue || !venue.isActive) throw new NotFoundError('Venue not found');
    return toPublicVenue(venue);
  }

  async update(venueId: string, userId: string, input: UpdateVenueInput) {
    const existing = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!existing || !existing.isActive) throw new NotFoundError('Venue not found');
    if (existing.createdBy !== userId) {
      throw new ForbiddenError('Only the venue creator can update it');
    }

    const venue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
        ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
      },
    });

    Logger.info('Venue updated', { venueId });
    return toPublicVenue(venue);
  }

  async softDelete(venueId: string, userId: string) {
    const existing = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!existing || !existing.isActive) throw new NotFoundError('Venue not found');
    if (existing.createdBy !== userId) {
      throw new ForbiddenError('Only the venue creator can delete it');
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: { isActive: false },
    });

    Logger.info('Venue deactivated', { venueId });
  }
}

export const venuesService = new VenuesService();
