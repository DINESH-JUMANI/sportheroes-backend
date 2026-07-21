import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { sportRulesService } from './sport-rules.service';
import { sportsService } from './sports.service';

export class SportsController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      activeOnly: boolean;
    };
    const result = await sportsService.listSports(query.page, query.limit, query.activeOnly);
    sendSuccess(res, 'Sports fetched', result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.getSportById(req.params.id);
    sendSuccess(res, 'Sport fetched', { sport });
  }

  async getByCode(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.getSportByCode(req.params.code);
    sendSuccess(res, 'Sport fetched', { sport });
  }

  async getRulesByCode(req: Request, res: Response): Promise<void> {
    const rules = await sportRulesService.getBySportCode(req.params.code);
    sendSuccess(res, 'Sport rules fetched', { rules });
  }

  async create(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.createSport(req.body);
    sendSuccess(res, 'Sport created', { sport }, 201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.updateSport(req.params.id, req.body);
    sendSuccess(res, 'Sport updated', { sport });
  }

  async remove(req: Request, res: Response): Promise<void> {
    const sport = await sportsService.deleteSport(req.params.id);
    sendSuccess(res, 'Sport deactivated', { sport });
  }
}

export const sportsController = new SportsController();
