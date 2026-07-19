import { MatchSideType, MatchStatusType, Prisma, PointType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import {
  getMatchWinnerSide,
  isSetWon,
  parseMatchFormat,
  currentServer,
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

  async recordPoint(
    matchId: string,
    userId: string,
    scoringSide: MatchSideType,
    pointType: PointType = 'normal',
  ) {
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

      // Compute server side BEFORE the point is recorded (stateless based on scores before this rally)
      let serverSide: MatchSideType | null = null;
      if (typeof format.serve_switch_interval === 'number' || format.sport_code === 'BAD') {
        // Fetch active set points to find lastPointSide for Badminton
        const activeSetPoints = await tx.matchPoint.findMany({
          where: { matchId, matchSetId: currentSet.id, isUndone: false },
          orderBy: { pointNumber: 'asc' },
        });

        // Fetch first point of the match to check for custom initial server
        const firstPoint = await tx.matchPoint.findFirst({
          where: { matchId },
          orderBy: [{ recordedAt: 'asc' }, { pointNumber: 'asc' }],
        });

        let initialServerOfSet1: 'A' | 'B' = 'A';
        if (firstPoint && firstPoint.serverSide) {
          initialServerOfSet1 = firstPoint.serverSide as 'A' | 'B';
        } else {
          const customFirst = (format as any).firstServer || (format as any).first_server;
          if (customFirst === 'A' || customFirst === 'B') {
            initialServerOfSet1 = customFirst;
          }
        }

        let initialServerOfCurrentSet: 'A' | 'B' = 'A';
        if (format.sport_code === 'BAD') {
          if (currentSet.setNumber === 1) {
            initialServerOfCurrentSet = initialServerOfSet1;
          } else {
            const prevSet = match.sets.find((s) => s.setNumber === currentSet.setNumber - 1);
            initialServerOfCurrentSet = (prevSet?.winnerSide as 'A' | 'B') || initialServerOfSet1;
          }
        } else {
          initialServerOfCurrentSet =
            currentSet.setNumber % 2 === 1
              ? initialServerOfSet1
              : (initialServerOfSet1 === 'A' ? 'B' : 'A');
        }

        let lastPointSide: 'A' | 'B' | null = null;
        if (activeSetPoints.length > 0) {
          const nonLetPoints = activeSetPoints.filter(p => p.pointType !== 'let');
          if (nonLetPoints.length > 0) {
            lastPointSide = nonLetPoints[nonLetPoints.length - 1].scoringSide as 'A' | 'B';
          }
        }

        serverSide = currentServer(
          currentSet.sideAScore,
          currentSet.sideBScore,
          initialServerOfCurrentSet,
          format,
          lastPointSide,
        );
      }

      const lastPoint = await tx.matchPoint.findFirst({
        where: { matchId, matchSetId: currentSet.id },
        orderBy: { pointNumber: 'desc' },
      });

      if (pointType === 'let') {
        // For a let, the score does not change.
        const point = await tx.matchPoint.create({
          data: {
            matchId,
            matchSetId: currentSet.id,
            pointNumber: (lastPoint?.pointNumber ?? 0) + 1,
            scoringSide, // required by DB constraint
            sideAScoreAfter: currentSet.sideAScore,
            sideBScoreAfter: currentSet.sideBScore,
            recordedBy: userId,
            pointType,
            serverSide,
          },
        });

        Logger.debug('Let point recorded', { matchId, scoringSide, pointId: point.id });
        return point;
      }

      const newSideA =
        scoringSide === 'A' ? currentSet.sideAScore + 1 : currentSet.sideAScore;
      const newSideB =
        scoringSide === 'B' ? currentSet.sideBScore + 1 : currentSet.sideBScore;

      const point = await tx.matchPoint.create({
        data: {
          matchId,
          matchSetId: currentSet.id,
          pointNumber: (lastPoint?.pointNumber ?? 0) + 1,
          scoringSide,
          sideAScoreAfter: newSideA,
          sideBScoreAfter: newSideB,
          recordedBy: userId,
          pointType,
          serverSide,
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
