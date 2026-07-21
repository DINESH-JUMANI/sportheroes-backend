import { prisma } from '../config/prisma';
import { Logger } from './logger';

/**
 * Ensure the user has a player_sport_profile for every active sport.
 * Idempotent — safe to call on login and after user create.
 * New profiles default to skillLevel=beginner; first linked sport becomes primary
 * only if the user has no primary sport yet.
 */
export async function ensureUserLinkedToAllSports(userId: string): Promise<void> {
  const sports = await prisma.sport.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true },
  });
  if (sports.length === 0) return;

  const existing = await prisma.playerSportProfile.findMany({
    where: { userId },
    select: { sportId: true, isPrimarySport: true },
  });
  const existingIds = new Set(existing.map((e) => e.sportId));
  const hasPrimary = existing.some((e) => e.isPrimarySport);

  const missing = sports.filter((s) => !existingIds.has(s.id));
  if (missing.length === 0) return;

  await prisma.playerSportProfile.createMany({
    data: missing.map((sport, index) => ({
      userId,
      sportId: sport.id,
      skillLevel: 'beginner' as const,
      rankingPoints: 0,
      isPrimarySport: !hasPrimary && index === 0,
    })),
    skipDuplicates: true,
  });

  Logger.info('User linked to sports', {
    userId,
    added: missing.length,
    totalActive: sports.length,
  });
}
