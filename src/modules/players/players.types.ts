import type { PlayerSportProfile, Sport } from '@prisma/client';
import { toPublicSport, type PublicSport } from '../sports/sports.types';

export interface PublicPlayerSportProfile {
  id: string;
  userId: string;
  sportId: string;
  skillLevel: string;
  rankingPoints: number;
  isPrimarySport: boolean;
  sport?: PublicSport;
  createdAt: string;
  updatedAt: string;
}

export function toPublicPlayerSportProfile(
  profile: PlayerSportProfile & { sport?: Sport },
): PublicPlayerSportProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    sportId: profile.sportId,
    skillLevel: profile.skillLevel,
    rankingPoints: profile.rankingPoints,
    isPrimarySport: profile.isPrimarySport,
    sport: profile.sport ? toPublicSport(profile.sport) : undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
