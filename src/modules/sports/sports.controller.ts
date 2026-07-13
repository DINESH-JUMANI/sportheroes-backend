import { Request, Response } from 'express';
import { sportsService } from './sports.service';

export class SportsController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      activeOnly: boolean;
    };
    const result = await sportsService.listSports(query.page, query.limit, query.activeOnly);
    res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.getSportById(req.params.id);
    res.status(200).json({ success: true, data: { sport } });
  }

  async getByCode(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.getSportByCode(req.params.code);
    res.status(200).json({ success: true, data: { sport } });
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    const profile = await sportsService.createPlayerProfile(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Sport profile created',
      data: { profile },
    });
  }

  async myProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await sportsService.getMyProfiles(req.user!.id);
    res.status(200).json({ success: true, data: { profiles } });
  }

  async userProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await sportsService.getUserProfiles(req.params.userId);
    res.status(200).json({ success: true, data: { profiles } });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const profile = await sportsService.updatePlayerProfile(
      req.user!.id,
      req.params.id,
      req.body,
    );
    res.status(200).json({
      success: true,
      message: 'Sport profile updated',
      data: { profile },
    });
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    await sportsService.deletePlayerProfile(req.user!.id, req.params.id);
    res.status(200).json({ success: true, message: 'Sport profile deleted' });
  }
}

export const sportsController = new SportsController();
