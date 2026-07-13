import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { PublicSport, toPublicSport } from './sports.types';

export class SportsService {
  async getAllSports(): Promise<PublicSport[]> {
    Logger.debug('Fetching all active sports');
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return sports.map(toPublicSport);
  }

  async getSportByIdOrCode(idOrCode: string): Promise<PublicSport> {
    Logger.debug('Fetching sport by ID or code', { idOrCode });
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

    const sport = await prisma.sport.findFirst({
      where: {
        OR: [
          isUuid ? { id: idOrCode } : undefined,
          { code: idOrCode.toUpperCase() },
        ].filter(Boolean) as any,
        isActive: true,
      },
    });

    if (!sport) {
      Logger.warn('Sport not found', { idOrCode });
      throw new NotFoundError('Sport not found');
    }

    return toPublicSport(sport);
  }
}

export const sportsService = new SportsService();
