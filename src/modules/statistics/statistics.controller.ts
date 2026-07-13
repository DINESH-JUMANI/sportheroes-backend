import { Request, Response } from 'express';
import { statisticsService } from './statistics.service';

export class StatisticsController {
  async getPlayerStats(req: Request, res: Response): Promise<void> {
    const stats = await statisticsService.getPlayerStats(
      req.params.userId,
      req.query.sportId as string | undefined,
    );
    res.status(200).json({ success: true, data: { stats } });
  }

  async getTeamStats(req: Request, res: Response): Promise<void> {
    const stats = await statisticsService.getTeamStats(req.params.teamId);
    res.status(200).json({ success: true, data: { stats } });
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
    res.status(200).json({ success: true, data: result });
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
    res.status(200).json({ success: true, data: result });
  }
}

export const statisticsController = new StatisticsController();
