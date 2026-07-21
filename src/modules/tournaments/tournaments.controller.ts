import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { tournamentsService } from './tournaments.service';

export class TournamentsController {
  async create(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.create(req.user!.id, req.body);
    sendSuccess(res, 'Tournament created', { tournament }, 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      status?: string;
    };
    const result = await tournamentsService.list(
      query.page,
      query.limit,
      query.sportId,
      query.status,
    );
    sendSuccess(res, 'Tournaments fetched', result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.getById(req.params.id);
    sendSuccess(res, 'Tournament fetched', { tournament });
  }

  async update(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.update(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Tournament updated', { tournament });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.updateStatus(
      req.params.id,
      req.user!.id,
      req.body.status,
    );
    sendSuccess(res, 'Status updated', { tournament });
  }

  async registerParticipant(req: Request, res: Response): Promise<void> {
    const participant = await tournamentsService.registerParticipant(
      req.params.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, 'Registered', { participant }, 201);
  }

  async listParticipants(req: Request, res: Response): Promise<void> {
    const participants = await tournamentsService.listParticipants(req.params.id);
    sendSuccess(res, 'Participants fetched', { participants });
  }

  async updateParticipant(req: Request, res: Response): Promise<void> {
    const participant = await tournamentsService.updateParticipant(
      req.params.id,
      req.params.participantId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, 'Participant updated', { participant });
  }

  async createRound(req: Request, res: Response): Promise<void> {
    const round = await tournamentsService.createRound(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Round created', { round }, 201);
  }

  async listRounds(req: Request, res: Response): Promise<void> {
    const rounds = await tournamentsService.listRounds(req.params.id);
    sendSuccess(res, 'Rounds fetched', { rounds });
  }

  async getStandings(req: Request, res: Response): Promise<void> {
    const standings = await tournamentsService.getStandings(req.params.id);
    sendSuccess(res, 'Standings fetched', { standings });
  }
}

export const tournamentsController = new TournamentsController();
