import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { SaveProfileInput } from './players.validators';

export class PlayersService {
  async getProfilesByUserId(userId: string) {
    Logger.debug('Fetching sport profiles for user', { userId });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return prisma.playerSportProfile.findMany({
      where: { userId },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { isPrimarySport: 'desc' },
    });
  }

  async saveProfile(userId: string, input: SaveProfileInput) {
    const { sportId, isPrimarySport } = input;

    Logger.debug('Saving player sport profile', { userId, sportId });

    // Validate sport exists and is active
    const sport = await prisma.sport.findUnique({
      where: { id: sportId, isActive: true },
    });
    if (!sport) {
      throw new NotFoundError('Active sport not found');
    }

    return prisma.$transaction(async (tx) => {
      // If setting this profile as primary, unset other primary profiles for this user
      if (isPrimarySport) {
        await tx.playerSportProfile.updateMany({
          where: { userId, isPrimarySport: true },
          data: { isPrimarySport: false },
        });
      }

      // Upsert profile
      const profile = await tx.playerSportProfile.upsert({
        where: {
          userId_sportId: {
            userId,
            sportId,
          },
        },
        create: {
          userId,
          sportId,
          isPrimarySport: !!isPrimarySport,
        },
        update: {
          isPrimarySport: isPrimarySport !== undefined ? isPrimarySport : undefined,
        },
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      Logger.info('Saved player sport profile', { profileId: profile.id, userId, sportId });
      return profile;
    });
  }
}

export const playersService = new PlayersService();
