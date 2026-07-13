import { Request, Response } from 'express';
import { playersService } from './players.service';
import { BadRequestError } from '../../utils/errors';

export class PlayersController {
  async getMyProfiles(req: Request, res: Response): Promise<Response> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User context missing');
    }
    const profiles = await playersService.getProfilesByUserId(userId);
    return res.status(200).json({
      success: true,
      data: profiles,
    });
  }

  async getUserProfiles(req: Request, res: Response): Promise<Response> {
    const { userId } = req.params;
    const profiles = await playersService.getProfilesByUserId(userId);
    return res.status(200).json({
      success: true,
      data: profiles,
    });
  }

  async saveProfile(req: Request, res: Response): Promise<Response> {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError('User context missing');
    }
    const profile = await playersService.saveProfile(userId, req.body);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  }
}

export const playersController = new PlayersController();
