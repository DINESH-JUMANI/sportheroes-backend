import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { venuesService } from './venues.service';

export class VenuesController {
  async create(req: Request, res: Response): Promise<void> {
    const venue = await venuesService.create(req.user!.id, req.body);
    sendSuccess(res, 'Venue created', { venue }, 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      q?: string;
      activeOnly: boolean;
    };
    const result = await venuesService.list(query.page, query.limit, query.q, query.activeOnly);
    sendSuccess(res, 'Venues fetched', result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const venue = await venuesService.getById(req.params.id);
    sendSuccess(res, 'Venue fetched', { venue });
  }

  async update(req: Request, res: Response): Promise<void> {
    const venue = await venuesService.update(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Venue updated', { venue });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await venuesService.softDelete(req.params.id, req.user!.id);
    sendSuccess(res, 'Venue deleted');
  }
}

export const venuesController = new VenuesController();
