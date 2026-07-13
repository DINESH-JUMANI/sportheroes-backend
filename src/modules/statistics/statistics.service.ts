import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { toPublicPlayerStatistics, toPublicTeamStatistics } from './statistics.types';

function calcWinPercentage(won: number, played: number): number {
  if (played === 0) return 0;
  return Math.round((won / played) * 10000) / 100;
}

export class StatisticsService {
  async recalculateForMatch(matchId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;

    const match = await db.match.findUnique({
      where: { id: matchId },
      include: {
        participants: true,
        sets: true,
      },
    });

    if (!match || match.status !== 'completed' || !match.winnerSide) return;

    const winnerSide = match.winnerSide;
    const loserSide = winnerSide === 'A' ? 'B' : 'A';

    const winnerSets = match.sets.filter((s) => s.winnerSide === winnerSide).length;
    const loserSets = match.sets.filter((s) => s.winnerSide === loserSide).length;

    const winnerPoints = match.sets.reduce(
      (sum, s) => sum + (winnerSide === 'A' ? s.sideAScore : s.sideBScore),
      0,
    );
    const loserPoints = match.sets.reduce(
      (sum, s) => sum + (loserSide === 'A' ? s.sideAScore : s.sideBScore),
      0,
    );

    for (const participant of match.participants) {
      const isWinner = participant.side === winnerSide;
      const pointsScored = isWinner ? winnerPoints : loserPoints;
      const pointsConceded = isWinner ? loserPoints : winnerPoints;
      const setsWon = isWinner ? winnerSets : loserSets;
      const setsLost = isWinner ? loserSets : winnerSets;

      if (participant.userId) {
        await this.upsertPlayerStats(db, {
          userId: participant.userId,
          sportId: match.sportId,
          won: isWinner,
          setsWon,
          setsLost,
          pointsScored,
          pointsConceded,
        });
      }

      if (participant.teamId) {
        await this.upsertTeamStats(db, {
          teamId: participant.teamId,
          won: isWinner,
          setsWon,
          setsLost,
        });
      }
    }

    if (match.tournamentId) {
      await this.updateTournamentStandings(db, match);
    }

    Logger.info('Statistics recalculated for match', { matchId });
  }

  private async upsertPlayerStats(
    db: Prisma.TransactionClient | typeof prisma,
    data: {
      userId: string;
      sportId: string;
      won: boolean;
      setsWon: number;
      setsLost: number;
      pointsScored: number;
      pointsConceded: number;
    },
  ) {
    const existing = await db.playerStatistics.findUnique({
      where: { userId_sportId: { userId: data.userId, sportId: data.sportId } },
    });

    const matchesPlayed = (existing?.matchesPlayed ?? 0) + 1;
    const matchesWon = (existing?.matchesWon ?? 0) + (data.won ? 1 : 0);
    const matchesLost = (existing?.matchesLost ?? 0) + (data.won ? 0 : 1);

    const stats = {
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: (existing?.setsWon ?? 0) + data.setsWon,
      setsLost: (existing?.setsLost ?? 0) + data.setsLost,
      totalPointsScored: (existing?.totalPointsScored ?? 0) + data.pointsScored,
      totalPointsConceded: (existing?.totalPointsConceded ?? 0) + data.pointsConceded,
      winPercentage: calcWinPercentage(matchesWon, matchesPlayed),
      currentRankingPoints:
        (existing?.currentRankingPoints ?? 0) + (data.won ? 10 : 0),
    };

    if (existing) {
      await db.playerStatistics.update({
        where: { id: existing.id },
        data: stats,
      });
    } else {
      await db.playerStatistics.create({
        data: { userId: data.userId, sportId: data.sportId, ...stats },
      });
    }

    await db.playerSportProfile.updateMany({
      where: { userId: data.userId, sportId: data.sportId },
      data: { rankingPoints: stats.currentRankingPoints },
    });
  }

  private async upsertTeamStats(
    db: Prisma.TransactionClient | typeof prisma,
    data: { teamId: string; won: boolean; setsWon: number; setsLost: number },
  ) {
    const existing = await db.teamStatistics.findUnique({ where: { teamId: data.teamId } });

    const matchesPlayed = (existing?.matchesPlayed ?? 0) + 1;
    const matchesWon = (existing?.matchesWon ?? 0) + (data.won ? 1 : 0);
    const matchesLost = (existing?.matchesLost ?? 0) + (data.won ? 0 : 1);

    const stats = {
      matchesPlayed,
      matchesWon,
      matchesLost,
      setsWon: (existing?.setsWon ?? 0) + data.setsWon,
      setsLost: (existing?.setsLost ?? 0) + data.setsLost,
      winPercentage: calcWinPercentage(matchesWon, matchesPlayed),
    };

    if (existing) {
      await db.teamStatistics.update({ where: { id: existing.id }, data: stats });
    } else {
      await db.teamStatistics.create({ data: { teamId: data.teamId, ...stats } });
    }
  }

  private async updateTournamentStandings(
    db: Prisma.TransactionClient | typeof prisma,
    match: {
      tournamentId: string | null;
      participants: { side: string; userId: string | null; teamId: string | null }[];
      winnerSide: string | null;
    },
  ) {
    if (!match.tournamentId || !match.winnerSide) return;

    const loserSide = match.winnerSide === 'A' ? 'B' : 'A';

    for (const p of match.participants) {
      const isWinner = p.side === match.winnerSide;
      const where = p.userId
        ? { tournamentId_userId: { tournamentId: match.tournamentId, userId: p.userId } }
        : { tournamentId_teamId: { tournamentId: match.tournamentId, teamId: p.teamId! } };

      const standing = await db.tournamentStanding.findUnique({ where: where as never });
      if (!standing) continue;

      await db.tournamentStanding.update({
        where: { id: standing.id },
        data: {
          matchesPlayed: standing.matchesPlayed + 1,
          wins: standing.wins + (isWinner ? 1 : 0),
          losses: standing.losses + (isWinner ? 0 : 1),
          points: standing.points + (isWinner ? 2 : 0),
        },
      });
    }

    const standings = await db.tournamentStanding.findMany({
      where: { tournamentId: match.tournamentId },
      orderBy: [{ points: 'desc' }, { wins: 'desc' }],
    });

    for (let i = 0; i < standings.length; i++) {
      await db.tournamentStanding.update({
        where: { id: standings[i].id },
        data: { position: i + 1 },
      });
    }
  }

  async getPlayerStats(userId: string, sportId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) throw new NotFoundError('User not found');

    const stats = await prisma.playerStatistics.findMany({
      where: { userId, ...(sportId ? { sportId } : {}) },
    });

    return stats.map(toPublicPlayerStatistics);
  }

  async getTeamStats(teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team?.isActive) throw new NotFoundError('Team not found');

    const stats = await prisma.teamStatistics.findUnique({ where: { teamId } });
    if (!stats) {
      return {
        teamId,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        winPercentage: 0,
      };
    }

    return toPublicTeamStatistics(stats);
  }

  async getPlayerLeaderboard(
    sportId: string,
    page: number,
    limit: number,
    sortBy: string,
  ) {
    const { skip, take } = getPagination({ page, limit });

    const orderBy =
      sortBy === 'win_percentage'
        ? { winPercentage: 'desc' as const }
        : sortBy === 'matches_played'
          ? { matchesPlayed: 'desc' as const }
          : { currentRankingPoints: 'desc' as const };

    const [stats, total] = await Promise.all([
      prisma.playerStatistics.findMany({
        where: { sportId },
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              displayName: true,
              profilePictureUrl: true,
              city: true,
              country: true,
            },
          },
        },
      }),
      prisma.playerStatistics.count({ where: { sportId } }),
    ]);

    return {
      leaderboard: stats.map((s) => ({
        ...toPublicPlayerStatistics(s),
        player: s.user,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getTeamLeaderboard(
    page: number,
    limit: number,
    sportId?: string,
    sortBy = 'win_percentage',
  ) {
    const { skip, take } = getPagination({ page, limit });

    const orderBy =
      sortBy === 'matches_played'
        ? { matchesPlayed: 'desc' as const }
        : { winPercentage: 'desc' as const };

    const where = sportId
      ? { team: { sportId, isActive: true } }
      : { team: { isActive: true } };

    const [stats, total] = await Promise.all([
      prisma.teamStatistics.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          team: { select: { id: true, name: true, shortName: true, logoUrl: true, sportId: true } },
        },
      }),
      prisma.teamStatistics.count({ where }),
    ]);

    return {
      leaderboard: stats.map((s) => ({
        ...toPublicTeamStatistics(s),
        team: s.team,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}

export const statisticsService = new StatisticsService();
