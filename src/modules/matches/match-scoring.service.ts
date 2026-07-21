import { MatchSideType, MatchStatusType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import {
  getMatchWinnerSide,
  isSetWon,
  parseMatchFormat,
} from '../../utils/match-format';
import { statisticsService } from '../statistics/statistics.service';

export class MatchScoringService {
  async logStatusChange(
    tx: Prisma.TransactionClient,
    matchId: string,
    previousStatus: MatchStatusType | null,
    newStatus: MatchStatusType,
    changedBy: string,
    reason?: string,
  ) {
    await tx.matchStatusLog.create({
      data: { matchId, previousStatus, newStatus, changedBy, reason },
    });
  }

  async recordPoint(matchId: string, userId: string, scoringSide: MatchSideType) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { sets: { orderBy: { setNumber: 'asc' } } },
      });

      if (!match) throw new NotFoundError('Match not found');
      if (match.status !== 'ongoing') {
        throw new BadRequestError('Points can only be recorded during an ongoing match');
      }

      const format = parseMatchFormat(match.matchFormat);
      const matchWinner = getMatchWinnerSide(match.sets, format);
      if (matchWinner) {
        throw new BadRequestError('Match is already decided');
      }

      let currentSet = match.sets.find((s) => !s.winnerSide);
      if (!currentSet) {
        const nextSetNumber = match.sets.length + 1;
        if (nextSetNumber > format.best_of_sets) {
          throw new BadRequestError('All sets are complete');
        }
        currentSet = await tx.matchSet.create({
          data: { matchId, setNumber: nextSetNumber, startedAt: new Date() },
        });
      } else if (!currentSet.startedAt) {
        currentSet = await tx.matchSet.update({
          where: { id: currentSet.id },
          data: { startedAt: new Date() },
        });
      }

      const newSideA =
        scoringSide === 'A' ? currentSet.sideAScore + 1 : currentSet.sideAScore;
      const newSideB =
        scoringSide === 'B' ? currentSet.sideBScore + 1 : currentSet.sideBScore;

      const lastPoint = await tx.matchPoint.findFirst({
        where: { matchId, matchSetId: currentSet.id },
        orderBy: { pointNumber: 'desc' },
      });

      const point = await tx.matchPoint.create({
        data: {
          matchId,
          matchSetId: currentSet.id,
          pointNumber: (lastPoint?.pointNumber ?? 0) + 1,
          scoringSide,
          sideAScoreAfter: newSideA,
          sideBScoreAfter: newSideB,
          recordedBy: userId,
        },
      });

      const setWinner = isSetWon(newSideA, newSideB, format, currentSet.setNumber);
      let updatedSet = await tx.matchSet.update({
        where: { id: currentSet.id },
        data: { sideAScore: newSideA, sideBScore: newSideB },
      });

      if (setWinner) {
        updatedSet = await tx.matchSet.update({
          where: { id: currentSet.id },
          data: { winnerSide: setWinner, endedAt: new Date() },
        });
      }

      const allSets = await tx.matchSet.findMany({
        where: { matchId },
        orderBy: { setNumber: 'asc' },
      });

      const winnerSide = getMatchWinnerSide(allSets, format);
      if (winnerSide) {
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: 'completed',
            winnerSide,
            finishedAt: new Date(),
          },
        });

        await tx.matchParticipant.updateMany({
          where: { matchId, side: winnerSide },
          data: { isWinner: true },
        });

        await this.logStatusChange(tx, matchId, 'ongoing', 'completed', userId);
        await statisticsService.recalculateForMatch(matchId, tx);
      }

      Logger.debug('Point recorded', { matchId, scoringSide, pointId: point.id });
      return point;
    });
  }

  /**
   * Manually finish the current open set.
   * Winner = body.winnerSide, else higher score; tied scores require winnerSide.
   * Opens the next set when the match is not yet decided; completes the match when
   * a side reaches sets_to_win (from bestOfSets at create).
   */
  async finishSet(
    matchId: string,
    userId: string,
    winnerSideInput?: MatchSideType,
  ) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { sets: { orderBy: { setNumber: 'asc' } } },
      });

      if (!match) throw new NotFoundError('Match not found');
      if (match.status !== 'ongoing') {
        throw new BadRequestError('Sets can only be finished during an ongoing match');
      }

      const format = parseMatchFormat(match.matchFormat);
      if (getMatchWinnerSide(match.sets, format)) {
        throw new BadRequestError('Match is already decided');
      }

      const currentSet = match.sets.find((s) => !s.winnerSide);
      if (!currentSet) {
        throw new BadRequestError('No open set to finish');
      }

      let winnerSide: MatchSideType;
      if (winnerSideInput) {
        winnerSide = winnerSideInput;
      } else if (currentSet.sideAScore > currentSet.sideBScore) {
        winnerSide = 'A';
      } else if (currentSet.sideBScore > currentSet.sideAScore) {
        winnerSide = 'B';
      } else {
        throw new BadRequestError(
          'Set scores are tied — provide winnerSide (A or B) to finish the set',
        );
      }

      await tx.matchSet.update({
        where: { id: currentSet.id },
        data: {
          winnerSide,
          endedAt: new Date(),
          startedAt: currentSet.startedAt ?? new Date(),
        },
      });

      const allSets = await tx.matchSet.findMany({
        where: { matchId },
        orderBy: { setNumber: 'asc' },
      });

      const matchWinner = getMatchWinnerSide(allSets, format);
      if (matchWinner) {
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: 'completed',
            winnerSide: matchWinner,
            finishedAt: new Date(),
          },
        });

        await tx.matchParticipant.updateMany({
          where: { matchId, side: matchWinner },
          data: { isWinner: true },
        });

        await this.logStatusChange(tx, matchId, 'ongoing', 'completed', userId);
        await statisticsService.recalculateForMatch(matchId, tx);
        Logger.info('Set finished — match completed', { matchId, winnerSide: matchWinner });
        return;
      }

      const nextSetNumber = allSets.length + 1;
      if (nextSetNumber <= format.best_of_sets) {
        await tx.matchSet.create({
          data: { matchId, setNumber: nextSetNumber, startedAt: new Date() },
        });

        Logger.info('Set finished — next set opened', {
          matchId,
          finishedSet: currentSet.setNumber,
          nextSet: nextSetNumber,
          setWinner: winnerSide,
        });
        return;
      }

      // Max sets played without hitting sets_to_win (edge case) — decide by set wins
      const wins = allSets.reduce(
        (acc, set) => {
          if (set.winnerSide === 'A') acc.A += 1;
          if (set.winnerSide === 'B') acc.B += 1;
          return acc;
        },
        { A: 0, B: 0 },
      );
      const fallbackWinner: MatchSideType | null =
        wins.A > wins.B ? 'A' : wins.B > wins.A ? 'B' : winnerSideInput ?? null;

      if (!fallbackWinner) {
        throw new BadRequestError(
          'Match is tied after all sets. Provide winnerSide to finish the deciding set as the match winner.',
        );
      }

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: 'completed',
          winnerSide: fallbackWinner,
          finishedAt: new Date(),
        },
      });
      await tx.matchParticipant.updateMany({
        where: { matchId, side: fallbackWinner },
        data: { isWinner: true },
      });
      await this.logStatusChange(tx, matchId, 'ongoing', 'completed', userId);
      await statisticsService.recalculateForMatch(matchId, tx);
      Logger.info('Set finished — match completed (all sets played)', {
        matchId,
        winnerSide: fallbackWinner,
      });
    });
  }

  async undoLastPoint(matchId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId } });
      if (!match) throw new NotFoundError('Match not found');
      if (!['ongoing', 'paused'].includes(match.status)) {
        throw new BadRequestError('Cannot undo points on a completed or cancelled match');
      }

      const lastPoint = await tx.matchPoint.findFirst({
        where: { matchId, isUndone: false },
        orderBy: [{ recordedAt: 'desc' }, { pointNumber: 'desc' }],
      });

      if (!lastPoint) throw new BadRequestError('No points to undo');

      await tx.matchPoint.update({
        where: { id: lastPoint.id },
        data: { isUndone: true },
      });

      const activePoints = await tx.matchPoint.findMany({
        where: { matchId, isUndone: false },
        orderBy: [{ matchSetId: 'asc' }, { pointNumber: 'asc' }],
      });

      const sets = await tx.matchSet.findMany({
        where: { matchId },
        orderBy: { setNumber: 'asc' },
      });

      const format = parseMatchFormat(match.matchFormat);

      for (const set of sets) {
        const setPoints = activePoints.filter((p) => p.matchSetId === set.id);
        const lastActive = setPoints[setPoints.length - 1];

        const sideAScore = lastActive?.sideAScoreAfter ?? 0;
        const sideBScore = lastActive?.sideBScoreAfter ?? 0;
        const setWinner = isSetWon(sideAScore, sideBScore, format, set.setNumber);

        await tx.matchSet.update({
          where: { id: set.id },
          data: {
            sideAScore,
            sideBScore,
            winnerSide: setWinner,
            endedAt: setWinner ? set.endedAt : null,
          },
        });
      }

      if (match.status === 'completed') {
        await tx.match.update({
          where: { id: matchId },
          data: { status: 'ongoing', winnerSide: null, finishedAt: null },
        });
        await tx.matchParticipant.updateMany({
          where: { matchId },
          data: { isWinner: false },
        });
        await this.logStatusChange(tx, matchId, 'completed', 'ongoing', userId, 'Point undone');
      }

      Logger.info('Point undone', { matchId, pointId: lastPoint.id });
    });
  }
}

export const matchScoringService = new MatchScoringService();
