import { prisma } from '../../config/prisma';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import type { CreatePlayerProfileInput, UpdatePlayerProfileInput } from './players.validators';
import { toPublicPlayerSportProfile } from './players.types';

export class PlayersService {
  async createPlayerProfile(userId: string, input: CreatePlayerProfileInput) {
    const sport = await prisma.sport.findUnique({ where: { id: input.sportId } });
    if (!sport || !sport.isActive) throw new NotFoundError('Sport not found');

    const existing = await prisma.playerSportProfile.findUnique({
      where: { userId_sportId: { userId, sportId: input.sportId } },
    });
    if (existing) throw new ConflictError('Player already has a profile for this sport');

    if (input.isPrimarySport) {
      await prisma.playerSportProfile.updateMany({
        where: { userId, isPrimarySport: true },
        data: { isPrimarySport: false },
      });
    }

    const profile = await prisma.playerSportProfile.create({
      data: {
        userId,
        sportId: input.sportId,
        skillLevel: input.skillLevel,
        isPrimarySport: input.isPrimarySport ?? false,
      },
      include: { sport: true },
    });

    Logger.info('Player sport profile created', { userId, sportId: input.sportId });
    return toPublicPlayerSportProfile(profile);
  }

  async getMyProfiles(userId: string) {
    const profiles = await prisma.playerSportProfile.findMany({
      where: { userId },
      include: { sport: true },
      orderBy: [{ isPrimarySport: 'desc' }, { createdAt: 'asc' }],
    });
    return profiles.map(toPublicPlayerSportProfile);
  }

  async getUserProfiles(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    const profiles = await prisma.playerSportProfile.findMany({
      where: { userId },
      include: { sport: true },
      orderBy: [{ isPrimarySport: 'desc' }, { createdAt: 'asc' }],
    });
    return profiles.map(toPublicPlayerSportProfile);
  }

  async updatePlayerProfile(userId: string, profileId: string, input: UpdatePlayerProfileInput) {
    const profile = await prisma.playerSportProfile.findFirst({
      where: { id: profileId, userId },
      include: { sport: true },
    });
    if (!profile) throw new NotFoundError('Player sport profile not found');

    if (input.isPrimarySport) {
      await prisma.playerSportProfile.updateMany({
        where: { userId, isPrimarySport: true, NOT: { id: profileId } },
        data: { isPrimarySport: false },
      });
    }

    const updated = await prisma.playerSportProfile.update({
      where: { id: profileId },
      data: input,
      include: { sport: true },
    });

    Logger.info('Player sport profile updated', { profileId, userId });
    return toPublicPlayerSportProfile(updated);
  }

  async deletePlayerProfile(userId: string, profileId: string) {
    const profile = await prisma.playerSportProfile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) throw new NotFoundError('Player sport profile not found');

    await prisma.playerSportProfile.delete({ where: { id: profileId } });
    Logger.info('Player sport profile deleted', { profileId, userId });
  }
}

export const playersService = new PlayersService();
