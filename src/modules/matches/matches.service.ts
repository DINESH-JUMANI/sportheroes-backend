import { MatchStatusType, Prisma, PointType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { matchScoringService } from './match-scoring.service';
import type { CreateMatchInput } from './matches.validators';
import { toPublicMatch, toPublicMatchPoint } from './matches.types';

export class MatchesService {
  async create(userId: string, input: CreateMatchInput) {
    const sport = await prisma.sport.findUnique({ where: { id: input.sportId } });
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

    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          sportId: input.sportId,
          tournamentId: input.tournamentId ?? null,
          tournamentRoundId: input.tournamentRoundId ?? null,
          matchType: input.matchType,
          matchFormat: sport.defaultMatchFormat as object,
          venue: input.venue ?? null,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          createdBy: userId,
          participants: {
            create: input.participants.map((p) => ({
              side: p.side,
              userId: p.userId ?? null,
              teamId: p.teamId ?? null,
            })),
          },
          sets: { create: { setNumber: 1 } },
        },
        include: {
          participants: { include: { user: true, team: true } },
          sets: true,
        },
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
    filters: { sportId?: string; tournamentId?: string; status?: string; createdBy?: string },
  ) {
    const { skip, take } = getPagination({ page, limit });
    const where = {
      ...(filters.sportId ? { sportId: filters.sportId } : {}),
      ...(filters.tournamentId ? { tournamentId: filters.tournamentId } : {}),
      ...(filters.status ? { status: filters.status as MatchStatusType } : {}),
      ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          participants: { include: { user: true, team: true } },
          sets: { orderBy: { setNumber: 'asc' } },
        },
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
      include: {
        participants: { include: { user: true, team: true } },
        sets: { orderBy: { setNumber: 'asc' } },
        points: {
          where: { isUndone: false },
          orderBy: { pointNumber: 'asc' },
        },
      },
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
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundError('Match not found');

    const allowed: Record<MatchStatusType, MatchStatusType[]> = {
      scheduled: ['ongoing', 'cancelled'],
      ongoing: ['paused', 'completed', 'cancelled'],
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
      if (newStatus === 'completed') data.finishedAt = new Date();
      if (newStatus === 'cancelled') data.finishedAt = new Date();

      const result = await tx.match.update({
        where: { id: matchId },
        data,
        include: {
          participants: { include: { user: true, team: true } },
          sets: { orderBy: { setNumber: 'asc' } },
          points: {
            where: { isUndone: false },
            orderBy: { pointNumber: 'asc' },
          },
        },
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

  async recordPoint(
    matchId: string,
    userId: string,
    scoringSide: 'A' | 'B',
    pointType?: PointType,
  ) {
    await matchScoringService.recordPoint(matchId, userId, scoringSide, pointType);
    return this.getById(matchId);
  }

  async undoPoint(matchId: string, userId: string) {
    await matchScoringService.undoLastPoint(matchId, userId);
    return this.getById(matchId);
  }
}

export const matchesService = new MatchesService();
