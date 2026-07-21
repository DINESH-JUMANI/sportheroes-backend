import { MatchSideType, MatchStatusType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import {
  applyBestOfSets,
  countSetWins,
  getMatchWinnerSide,
  isSetWon,
  parseMatchFormat,
} from '../../utils/match-format';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { resolveUserIdByPhone } from '../../utils/user-resolver';
import { statisticsService } from '../statistics/statistics.service';
import { matchScoringService } from './match-scoring.service';
import type {
  CompleteMatchInput,
  CreateMatchInput,
  FinishSetInput,
} from './matches.validators';
import { toPublicMatch, toPublicMatchPoint } from './matches.types';

const matchDetailInclude = {
  participants: { include: { user: true, team: true } },
  sets: { orderBy: { setNumber: 'asc' as const } },
  sport: true,
  venueRef: true,
};

export class MatchesService {
  async create(userId: string, input: CreateMatchInput) {
    const sport = input.sportCode
      ? await prisma.sport.findUnique({ where: { code: input.sportCode } })
      : await prisma.sport.findUnique({ where: { id: input.sportId! } });
    if (!sport?.isActive) throw new NotFoundError('Sport not found');

    const sides = input.participants.map((p) => p.side);
    if (!sides.includes('A') || !sides.includes('B')) {
      throw new BadRequestError('Match must have participants on both side A and side B');
    }

    if (input.matchType === 'singles') {
      const aCount = input.participants.filter((p) => p.side === 'A').length;
      const bCount = input.participants.filter((p) => p.side === 'B').length;
      if (aCount !== 1 || bCount !== 1) {
        throw new BadRequestError('Singles match requires exactly 1 participant per side');
      }
    }

    const resolvedParticipants = await Promise.all(
      input.participants.map(async (p) => {
        if (p.teamId) {
          const team = await prisma.team.findUnique({ where: { id: p.teamId, isActive: true } });
          if (!team) throw new NotFoundError(`Team not found: ${p.teamId}`);
          return { side: p.side, userId: null as string | null, teamId: p.teamId };
        }
        const resolvedUserId = await resolveUserIdByPhone(p.phoneNumber!, p.fullName);
        return { side: p.side, userId: resolvedUserId, teamId: null as string | null };
      }),
    );

    let venueName = input.venue ?? null;
    let venueId: string | null = input.venueId ?? null;
    if (venueId) {
      const venueRow = await prisma.venue.findUnique({ where: { id: venueId, isActive: true } });
      if (!venueRow) throw new NotFoundError('Venue not found');
      venueName = venueRow.name;
    }

    const matchFormat = applyBestOfSets(
      parseMatchFormat(sport.defaultMatchFormat),
      input.bestOfSets,
    );

    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          sportId: sport.id,
          tournamentId: input.tournamentId ?? null,
          tournamentRoundId: input.tournamentRoundId ?? null,
          matchType: input.matchType,
          matchFormat: matchFormat as object,
          venue: venueName,
          venueId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          createdBy: userId,
          participants: {
            create: resolvedParticipants.map((p) => ({
              side: p.side,
              userId: p.userId,
              teamId: p.teamId,
            })),
          },
          sets: { create: { setNumber: 1 } },
        },
        include: matchDetailInclude,
      });

      await matchScoringService.logStatusChange(tx, created.id, null, 'scheduled', userId);
      return created;
    });

    Logger.info('Match created', { matchId: match.id });
    return toPublicMatch(match);
  }

  async list(
    page: number,
    limit: number,
    filters: {
      sportId?: string;
      sportCode?: string;
      tournamentId?: string;
      status?: string;
      createdBy?: string;
      participantPhone?: string;
    },
  ) {
    const { skip, take } = getPagination({ page, limit });

    let resolvedSportId = filters.sportId;
    if (filters.sportCode && !filters.sportId) {
      const sport = await prisma.sport.findUnique({ where: { code: filters.sportCode } });
      if (sport) resolvedSportId = sport.id;
    }

    let participantUserId: string | undefined;
    if (filters.participantPhone) {
      const user = await prisma.user.findFirst({
        where: { phoneNumber: filters.participantPhone, isActive: true },
      });
      if (!user) {
        return { matches: [], meta: buildPaginationMeta(page, limit, 0) };
      }
      participantUserId = user.id;
    }

    const where: Prisma.MatchWhereInput = {
      ...(resolvedSportId ? { sportId: resolvedSportId } : {}),
      ...(filters.tournamentId ? { tournamentId: filters.tournamentId } : {}),
      ...(filters.status ? { status: filters.status as MatchStatusType } : {}),
      ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
      ...(participantUserId
        ? { participants: { some: { userId: participantUserId } } }
        : {}),
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: matchDetailInclude,
      }),
      prisma.match.count({ where }),
    ]);

    return {
      matches: matches.map(toPublicMatch),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: matchDetailInclude,
    });
    if (!match) throw new NotFoundError('Match not found');
    return toPublicMatch(match);
  }

  async getTimeline(id: string) {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundError('Match not found');

    const points = await prisma.matchPoint.findMany({
      where: { matchId: id },
      orderBy: [{ recordedAt: 'asc' }, { pointNumber: 'asc' }],
    });

    return points.map(toPublicMatchPoint);
  }

  async changeStatus(
    matchId: string,
    userId: string,
    newStatus: MatchStatusType,
    reason?: string,
  ) {
    if (newStatus === 'completed') {
      return this.completeMatch(matchId, userId, {});
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match not found');

    const allowed: Record<MatchStatusType, MatchStatusType[]> = {
      scheduled: ['ongoing', 'cancelled'],
      ongoing: ['paused', 'cancelled'],
      paused: ['ongoing', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowed[match.status].includes(newStatus)) {
      throw new BadRequestError(`Cannot transition from ${match.status} to ${newStatus}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data: Prisma.MatchUpdateInput = { status: newStatus };

      if (newStatus === 'ongoing' && !match.startedAt) data.startedAt = new Date();
      if (newStatus === 'cancelled') data.finishedAt = new Date();

      const result = await tx.match.update({
        where: { id: matchId },
        data,
        include: matchDetailInclude,
      });

      await matchScoringService.logStatusChange(
        tx,
        matchId,
        match.status,
        newStatus,
        userId,
        reason,
      );

      return result;
    });

    Logger.info('Match status changed', { matchId, from: match.status, to: newStatus });
    return toPublicMatch(updated);
  }

  /**
   * Complete a match: resolve winner from sets / scores / optional body.winnerSide,
   * then recalculate player/team statistics.
   */
  async completeMatch(matchId: string, userId: string, input: CompleteMatchInput = {}) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { sets: { orderBy: { setNumber: 'asc' } } },
    });
    if (!match) throw new NotFoundError('Match not found');

    if (!['ongoing', 'paused'].includes(match.status) && match.status !== 'completed') {
      throw new BadRequestError(`Cannot complete match from status ${match.status}`);
    }

    // Already completed with winner + stats — idempotent return
    if (match.status === 'completed' && match.winnerSide) {
      return this.getById(matchId);
    }

    const format = parseMatchFormat(match.matchFormat);
    const winnerSide = this.resolveWinnerSide(
      match.sets,
      format,
      input.winnerSide as MatchSideType | undefined,
    );

    const updated = await prisma.$transaction(async (tx) => {
      // Finalize unfinished set winners from scores when possible
      for (const set of match.sets) {
        if (set.winnerSide) continue;
        const setWinner =
          isSetWon(set.sideAScore, set.sideBScore, format, set.setNumber) ??
          (set.sideAScore !== set.sideBScore
            ? set.sideAScore > set.sideBScore
              ? ('A' as const)
              : ('B' as const)
            : null);
        if (setWinner) {
          await tx.matchSet.update({
            where: { id: set.id },
            data: { winnerSide: setWinner, endedAt: set.endedAt ?? new Date() },
          });
        }
      }

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'completed',
          winnerSide,
          finishedAt: match.finishedAt ?? new Date(),
          ...(match.startedAt ? {} : { startedAt: new Date() }),
        },
      });

      await tx.matchParticipant.updateMany({
        where: { matchId },
        data: { isWinner: false },
      });
      await tx.matchParticipant.updateMany({
        where: { matchId, side: winnerSide },
        data: { isWinner: true },
      });

      if (match.status !== 'completed') {
        await matchScoringService.logStatusChange(
          tx,
          matchId,
          match.status,
          'completed',
          userId,
        );
      }

      await statisticsService.recalculateForMatch(matchId, tx);

      return tx.match.findUniqueOrThrow({
        where: { id: matchId },
        include: matchDetailInclude,
      });
    });

    Logger.info('Match completed with stats', { matchId, winnerSide });
    return toPublicMatch(updated);
  }

  private resolveWinnerSide(
    sets: { sideAScore: number; sideBScore: number; winnerSide: string | null; setNumber: number }[],
    format: ReturnType<typeof parseMatchFormat>,
    forced?: MatchSideType,
  ): MatchSideType {
    if (forced) return forced;

    const projected = sets.map((set) => {
      if (set.winnerSide === 'A' || set.winnerSide === 'B') {
        return { winnerSide: set.winnerSide as MatchSideType };
      }
      const byRules = isSetWon(set.sideAScore, set.sideBScore, format, set.setNumber);
      if (byRules) return { winnerSide: byRules };
      if (set.sideAScore > set.sideBScore) return { winnerSide: 'A' as const };
      if (set.sideBScore > set.sideAScore) return { winnerSide: 'B' as const };
      return { winnerSide: null };
    });

    const byFormat = getMatchWinnerSide(projected, format);
    if (byFormat) return byFormat;

    const wins = countSetWins(projected);
    if (wins.A > wins.B) return 'A';
    if (wins.B > wins.A) return 'B';

    const pointsA = sets.reduce((s, set) => s + set.sideAScore, 0);
    const pointsB = sets.reduce((s, set) => s + set.sideBScore, 0);
    if (pointsA > pointsB) return 'A';
    if (pointsB > pointsA) return 'B';

    throw new BadRequestError(
      'Cannot determine match winner. Pass winnerSide: "A" or "B" in the request body.',
    );
  }

  async recordPoint(matchId: string, userId: string, scoringSide: 'A' | 'B') {
    await matchScoringService.recordPoint(matchId, userId, scoringSide);
    return this.getById(matchId);
  }

  async finishSet(matchId: string, userId: string, input: FinishSetInput = {}) {
    await matchScoringService.finishSet(
      matchId,
      userId,
      input.winnerSide as MatchSideType | undefined,
    );
    return this.getById(matchId);
  }

  async undoPoint(matchId: string, userId: string) {
    await matchScoringService.undoLastPoint(matchId, userId);
    return this.getById(matchId);
  }
}

export const matchesService = new MatchesService();
