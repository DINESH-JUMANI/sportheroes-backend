import { Request, Response } from 'express';
import { tournamentsService } from './tournaments.service';

export class TournamentsController {
  async create(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Tournament created', data: { tournament } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      status?: string;
    };
    const result = await tournamentsService.list(query.page, query.limit, query.sportId, query.status);
    res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.getById(req.params.id);
    res.status(200).json({ success: true, data: { tournament } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.update(req.params.id, req.user!.id, req.body);
    res.status(200).json({ success: true, message: 'Tournament updated', data: { tournament } });
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    const tournament = await tournamentsService.updateStatus(
      req.params.id,
      req.user!.id,
      req.body.status,
    );
    res.status(200).json({ success: true, message: 'Status updated', data: { tournament } });
  }

  async registerParticipant(req: Request, res: Response): Promise<void> {
    const participant = await tournamentsService.registerParticipant(
      req.params.id,
      req.user!.id,
      req.body,
    );
    res.status(201).json({ success: true, message: 'Registered', data: { participant } });
  }

  async listParticipants(req: Request, res: Response): Promise<void> {
    const participants = await tournamentsService.listParticipants(req.params.id);
    res.status(200).json({ success: true, data: { participants } });
  }

  async updateParticipant(req: Request, res: Response): Promise<void> {
    const participant = await tournamentsService.updateParticipant(
      req.params.id,
      req.params.participantId,
      req.user!.id,
      req.body,
    );
    res.status(200).json({ success: true, message: 'Participant updated', data: { participant } });
  }

  async createRound(req: Request, res: Response): Promise<void> {
    const round = await tournamentsService.createRound(req.params.id, req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Round created', data: { round } });
  }

  async listRounds(req: Request, res: Response): Promise<void> {
    const rounds = await tournamentsService.listRounds(req.params.id);
    res.status(200).json({ success: true, data: { rounds } });
  }

  async getStandings(req: Request, res: Response): Promise<void> {
    const standings = await tournamentsService.getStandings(req.params.id);
    res.status(200).json({ success: true, data: { standings } });
  }
}

export const tournamentsController = new TournamentsController();
