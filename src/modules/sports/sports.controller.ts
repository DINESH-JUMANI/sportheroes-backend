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

  async create(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.createSport(req.body);
    res.status(201).json({
      success: true,
      message: 'Sport created',
      data: { sport },
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.updateSport(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Sport updated',
      data: { sport },
    });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.deleteSport(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Sport deactivated',
      data: { sport },
    });
  }
}

export const sportsController = new SportsController();
