import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { matchesService } from './matches.service';

export class MatchesController {
  async create(req: Request, res: Response): Promise<void> {
    const match = await matchesService.create(req.user!.id, req.body);
    sendSuccess(res, 'Match created', { match }, 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      sportCode?: string;
      tournamentId?: string;
      status?: string;
      createdBy?: string;
      participantPhone?: string;
    };
    const result = await matchesService.list(query.page, query.limit, {
      sportId: query.sportId,
      sportCode: query.sportCode,
      tournamentId: query.tournamentId,
      status: query.status,
      createdBy: query.createdBy,
      participantPhone: query.participantPhone,
    });
    sendSuccess(res, 'Matches fetched', result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const match = await matchesService.getById(req.params.id);
    sendSuccess(res, 'Match fetched', { match });
  }

  async getTimeline(req: Request, res: Response): Promise<void> {
    const timeline = await matchesService.getTimeline(req.params.id);
    sendSuccess(res, 'Match timeline fetched', { timeline });
  }

  async start(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'ongoing');
    sendSuccess(res, 'Match started', { match });
  }

  async pause(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'paused');
    sendSuccess(res, 'Match paused', { match });
  }

  async resume(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(req.params.id, req.user!.id, 'ongoing');
    sendSuccess(res, 'Match resumed', { match });
  }

  async recordPoint(req: Request, res: Response): Promise<void> {
    const match = await matchesService.recordPoint(
      req.params.id,
      req.user!.id,
      req.body.scoringSide,
    );
    sendSuccess(res, 'Point recorded', { match });
  }

  async undoPoint(req: Request, res: Response): Promise<void> {
    const match = await matchesService.undoPoint(req.params.id, req.user!.id);
    sendSuccess(res, 'Point undone', { match });
  }

  async complete(req: Request, res: Response): Promise<void> {
    const match = await matchesService.completeMatch(req.params.id, req.user!.id, req.body ?? {});
    sendSuccess(res, 'Match completed', { match });
  }

  async finishSet(req: Request, res: Response): Promise<void> {
    const match = await matchesService.finishSet(req.params.id, req.user!.id, req.body ?? {});
    sendSuccess(res, 'Set finished', { match });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const match = await matchesService.changeStatus(
      req.params.id,
      req.user!.id,
      'cancelled',
      req.body?.reason,
    );
    sendSuccess(res, 'Match cancelled', { match });
  }
}

export const matchesController = new MatchesController();
