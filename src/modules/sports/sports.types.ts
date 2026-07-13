import { Sport } from '@prisma/client';

export type PublicSport = Omit<Sport, 'createdAt' | 'updatedAt'>;

export function toPublicSport(sport: Sport): PublicSport {
  return {
    id: sport.id,
    name: sport.name,
    code: sport.code,
    iconUrl: sport.iconUrl,
    description: sport.description,
    isTeamSport: sport.isTeamSport,
    defaultMatchFormat: sport.defaultMatchFormat as any,
    isActive: sport.isActive,
  };
}
