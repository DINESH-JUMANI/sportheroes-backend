import { Request, Response } from 'express';
import { sportsService } from './sports.service';

export class SportsController {
  async getAll(req: Request, res: Response): Promise<Response> {
    const sports = await sportsService.getAllSports();
    return res.status(200).json({
      success: true,
      data: sports,
    });
  }

  async getOne(req: Request, res: Response): Promise<Response> {
    const { idOrCode } = req.params;
    const sport = await sportsService.getSportByIdOrCode(idOrCode);
    return res.status(200).json({
      success: true,
      data: sport,
    });
  }
}

export const sportsController = new SportsController();
