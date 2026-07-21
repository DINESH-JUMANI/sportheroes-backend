import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { teamsService } from './teams.service';

export class TeamsController {
  async create(req: Request, res: Response): Promise<void> {
    const team = await teamsService.create(req.user!.id, req.body);
    sendSuccess(res, 'Team created', { team }, 201);
  }

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      activeOnly: boolean;
    };
    const result = await teamsService.list(query.page, query.limit, query.activeOnly);
    sendSuccess(res, 'Teams fetched', result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const team = await teamsService.getById(req.params.id);
    sendSuccess(res, 'Team fetched', { team });
  }

  async update(req: Request, res: Response): Promise<void> {
    const team = await teamsService.update(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Team updated', { team });
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    const team = await teamsService.uploadLogo(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Team logo updated', { team });
  }

  async getLogo(req: Request, res: Response): Promise<void> {
    const { buffer, mimeType } = await teamsService.getLogo(req.params.id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buffer);
  }

  async remove(req: Request, res: Response): Promise<void> {
    await teamsService.softDelete(req.params.id, req.user!.id);
    sendSuccess(res, 'Team deleted');
  }

  async lookupUser(req: Request, res: Response): Promise<void> {
    const { phoneNumber } = req.query as { phoneNumber: string };
    const result = await teamsService.lookupUserByPhone(phoneNumber);
    sendSuccess(res, 'User lookup completed', result);
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const member = await teamsService.addMember(req.params.id, req.user!.id, req.body);
    sendSuccess(res, 'Member added', { member }, 201);
  }

  async updateMember(req: Request, res: Response): Promise<void> {
    const member = await teamsService.updateMember(
      req.params.id,
      req.params.memberId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, 'Member updated', { member });
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    await teamsService.removeMember(req.params.id, req.params.memberId, req.user!.id);
    sendSuccess(res, 'Member removed');
  }

  async listMembers(req: Request, res: Response): Promise<void> {
    const members = await teamsService.listMembers(req.params.id);
    sendSuccess(res, 'Members fetched', { members });
  }
}

export const teamsController = new TeamsController();
