import type { Sport } from '@prisma/client';

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
