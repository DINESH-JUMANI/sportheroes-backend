import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type { CreateSportInput, UpdateSportInput } from './sports.validators';
import { toPublicSport } from './sports.types';

export class SportsService {
  async listSports(page: number, limit: number, activeOnly = true) {
    const { skip, take } = getPagination({ page, limit });
    const where = activeOnly ? { isActive: true } : {};

    const [sports, total] = await Promise.all([
      prisma.sport.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.sport.count({ where }),
    ]);

    return {
      sports: sports.map(toPublicSport),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getSportById(id: string) {
    const sport = await prisma.sport.findUnique({ where: { id } });
    if (!sport) throw new NotFoundError('Sport not found');
    return toPublicSport(sport);
  }

  async getSportByCode(code: string) {
    const sport = await prisma.sport.findUnique({ where: { code: code.toUpperCase() } });
    if (!sport) throw new NotFoundError('Sport not found');
    return toPublicSport(sport);
  }

  async createSport(input: CreateSportInput) {
    const existing = await prisma.sport.findFirst({
      where: {
        OR: [{ code: input.code }, { name: input.name }],
      },
    });
    if (existing) {
      throw new ConflictError(
        existing.code === input.code
          ? `Sport with code ${input.code} already exists`
          : `Sport with name ${input.name} already exists`,
      );
    }

    const sport = await prisma.sport.create({
      data: {
        name: input.name,
        code: input.code,
        iconUrl: input.iconUrl ?? null,
        description: input.description ?? null,
        isTeamSport: input.isTeamSport ?? false,
        defaultMatchFormat: input.defaultMatchFormat,
        isActive: input.isActive ?? true,
      },
    });

    Logger.info('Sport created', { sportId: sport.id, code: sport.code });
    return toPublicSport(sport);
  }

  async updateSport(id: string, input: UpdateSportInput) {
    const existing = await prisma.sport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Sport not found');

    if (input.code || input.name) {
      const clash = await prisma.sport.findFirst({
        where: {
          NOT: { id },
          OR: [
            ...(input.code ? [{ code: input.code }] : []),
            ...(input.name ? [{ name: input.name }] : []),
          ],
        },
      });
      if (clash) {
        throw new ConflictError('Another sport already uses this name or code');
      }
    }

    const sport = await prisma.sport.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isTeamSport !== undefined ? { isTeamSport: input.isTeamSport } : {}),
        ...(input.defaultMatchFormat !== undefined
          ? { defaultMatchFormat: input.defaultMatchFormat }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    Logger.info('Sport updated', { sportId: id });
    return toPublicSport(sport);
  }

  async deleteSport(id: string) {
    const existing = await prisma.sport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Sport not found');

    // Soft-delete so historical matches/teams keep their FK
    const sport = await prisma.sport.update({
      where: { id },
      data: { isActive: false },
    });

    Logger.info('Sport deactivated', { sportId: id });
    return toPublicSport(sport);
  }
}

export const sportsService = new SportsService();
