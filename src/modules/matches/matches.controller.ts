import { Request, Response } from 'express';
import { matchesService } from './matches.service';

export class MatchesController {
  async create(req: Request, res: Response): Promise<void> {
    const match = await matchesService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Match created', data: { match } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      tournamentId?: string;
      status?: string;
      createdBy?: string;
    };
    const result = await matchesService.list(query.page, query.limit, {
      sportId: query.sportId,
      tournamentId: query.tournamentId,
      status: query.status,
      createdBy: query.createdBy,
    });
    res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const match = await matchesService.getById(req.params.id);
    res.status(200).json({ success: true, data: { match } });
  }

  async getTimeline(req: Request, res: Response): Promise<void> {
    const timeline = await matchesService.getTimeline(req.params.id);
    res.status(200).json({ success: true, data: { timeline } });
  }

  async start(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'ongoing');
    res.status(200).json({ success: true, message: 'Match started', data: { match } });
  }

  async pause(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'paused');
    res.status(200).json({ success: true, message: 'Match paused', data: { match } });
  }

  async resume(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'ongoing');
    res.status(200).json({ success: true, message: 'Match resumed', data: { match } });
  }

  async recordPoint(req: Request, res: Response): Promise<void> {
    const match = await matchesService.recordPoint(
      req.params.id,
      req.user!.id,
      req.body.scoringSide,
      req.body.pointType,
    );
    res.status(200).json({ success: true, message: 'Point recorded', data: { match } });
  }

  async undoPoint(req: Request, res: Response): Promise<void> {
    const match = await matchesService.undoPoint(req.params.id, req.user!.id);
    res.status(200).json({ success: true, message: 'Point undone', data: { match } });
  }

  async complete(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'completed');
    res.status(200).json({ success: true, message: 'Match completed', data: { match } });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(
      req.params.id,
      req.user!.id,
      'cancelled',
      req.body?.reason,
    );
    res.status(200).json({ success: true, message: 'Match cancelled', data: { match } });
  }
}

export const matchesController = new MatchesController();
