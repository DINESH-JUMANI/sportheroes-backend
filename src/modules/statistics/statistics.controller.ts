import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { statisticsService } from './statistics.service';

export class StatisticsController {
  async getPlayerStats(req: Request, res: Response): Promise<void> {
    const stats = await statisticsService.getPlayerStats(
      req.params.userId,
      req.query.sportId as string | undefined,
    );
    sendSuccess(res, 'Player statistics fetched', { stats });
  }

  async getTeamStats(req: Request, res: Response): Promise<void> {
    const stats = await statisticsService.getTeamStats(req.params.teamId);
    sendSuccess(res, 'Team statistics fetched', { stats });
  }

  async getPlayerLeaderboard(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId: string;
      sortBy: string;
    };
    const result = await statisticsService.getPlayerLeaderboard(
      query.sportId,
      query.page,
      query.limit,
      query.sortBy,
    );
    sendSuccess(res, 'Player leaderboard fetched', result);
  }

  async getTeamLeaderboard(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      sortBy: string;
    };
    const result = await statisticsService.getTeamLeaderboard(
      query.page,
      query.limit,
      query.sportId,
      query.sortBy,
    );
    sendSuccess(res, 'Team leaderboard fetched', result);
  }
}

export const statisticsController = new StatisticsController();
