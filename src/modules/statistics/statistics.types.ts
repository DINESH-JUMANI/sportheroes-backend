import type { PlayerStatistics, TeamStatistics } from '@prisma/client';

export interface PublicPlayerStatistics {
  id: string;
  userId: string;
  sportId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  winPercentage: number;
  currentRankingPoints: number;
  updatedAt: string;
}

export interface PublicTeamStatistics {
  id: string;
  teamId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  winPercentage: number;
  updatedAt: string;
}

export function toPublicPlayerStatistics(s: PlayerStatistics): PublicPlayerStatistics {
  return {
    id: s.id,
    userId: s.userId,
    sportId: s.sportId,
    matchesPlayed: s.matchesPlayed,
    matchesWon: s.matchesWon,
    matchesLost: s.matchesLost,
    setsWon: s.setsWon,
    setsLost: s.setsLost,
    totalPointsScored: s.totalPointsScored,
    totalPointsConceded: s.totalPointsConceded,
    winPercentage: Number(s.winPercentage),
    currentRankingPoints: s.currentRankingPoints,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toPublicTeamStatistics(s: TeamStatistics): PublicTeamStatistics {
  return {
    id: s.id,
    teamId: s.teamId,
    matchesPlayed: s.matchesPlayed,
    matchesWon: s.matchesWon,
    matchesLost: s.matchesLost,
    setsWon: s.setsWon,
    setsLost: s.setsLost,
    winPercentage: Number(s.winPercentage),
    updatedAt: s.updatedAt.toISOString(),
  };
}
