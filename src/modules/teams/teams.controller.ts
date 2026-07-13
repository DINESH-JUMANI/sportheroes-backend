import { Request, Response } from 'express';
import { teamsService } from './teams.service';

export class TeamsController {
  async create(req: Request, res: Response): Promise<void> {
    const team = await teamsService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Team created', data: { team } });
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      sportId?: string;
      activeOnly: boolean;
    };
    const result = await teamsService.list(query.page, query.limit, query.sportId, query.activeOnly);
    res.status(200).json({ success: true, data: result });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const team = await teamsService.getById(req.params.id);
    res.status(200).json({ success: true, data: { team } });
  }

  async update(req: Request, res: Response): Promise<void> {
    const team = await teamsService.update(req.params.id, req.user!.id, req.body);
    res.status(200).json({ success: true, message: 'Team updated', data: { team } });
  }

  async remove(req: Request, res: Response): Promise<void> {
    await teamsService.softDelete(req.params.id, req.user!.id);
    res.status(200).json({ success: true, message: 'Team deleted' });
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const member = await teamsService.addMember(req.params.id, req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Member added', data: { member } });
  }

  async updateMember(req: Request, res: Response): Promise<void> {
    const member = await teamsService.updateMember(
      req.params.id,
      req.params.memberId,
      req.user!.id,
      req.body,
    );
    res.status(200).json({ success: true, message: 'Member updated', data: { member } });
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    await teamsService.removeMember(req.params.id, req.params.memberId, req.user!.id);
    res.status(200).json({ success: true, message: 'Member removed' });
  }

  async listMembers(req: Request, res: Response): Promise<void> {
    const members = await teamsService.listMembers(req.params.id);
    res.status(200).json({ success: true, data: { members } });
  }
}

export const teamsController = new TeamsController();
