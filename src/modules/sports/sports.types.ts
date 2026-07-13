import type { Sport, PlayerSportProfile } from '@prisma/client';

export interface PublicSport {
  id: string;
  name: string;
  code: string;
  iconUrl: string | null;
  description: string | null;
  isTeamSport: boolean;
  defaultMatchFormat: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export function toPublicSport(sport: Sport): PublicSport {
  return {
    id: sport.id,
    name: sport.name,
    code: sport.code,
    iconUrl: sport.iconUrl,
    description: sport.description,
    isTeamSport: sport.isTeamSport,
    defaultMatchFormat: sport.defaultMatchFormat as Record<string, unknown>,
    isActive: sport.isActive,
    createdAt: sport.createdAt.toISOString(),
    updatedAt: sport.updatedAt.toISOString(),
  };
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
