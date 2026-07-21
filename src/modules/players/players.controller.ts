import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { playersService } from './players.service';

export class PlayersController {
  async createProfile(req: Request, res: Response): Promise<void> {
    const profile = await playersService.createPlayerProfile(req.user!.id, req.body);
    sendSuccess(res, 'Sport profile created', { profile }, 201);
  }

  async myProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await playersService.getMyProfiles(req.user!.id);
    sendSuccess(res, 'Sport profiles fetched', { profiles });
  }

  async userProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await playersService.getUserProfiles(req.params.userId);
    sendSuccess(res, 'Sport profiles fetched', { profiles });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const profile = await playersService.updatePlayerProfile(
      req.user!.id,
      req.params.id,
      req.body,
    );
    sendSuccess(res, 'Sport profile updated', { profile });
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    await playersService.deletePlayerProfile(req.user!.id, req.params.id);
    sendSuccess(res, 'Sport profile deleted');
  }
}

export const playersController = new PlayersController();
