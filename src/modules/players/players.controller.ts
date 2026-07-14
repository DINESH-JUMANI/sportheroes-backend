import { Request, Response } from 'express';
import { playersService } from './players.service';

export class PlayersController {
  async createProfile(req: Request, res: Response): Promise<void> {
    const profile = await playersService.createPlayerProfile(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Sport profile created',
      data: { profile },
    });
  }

  async myProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await playersService.getMyProfiles(req.user!.id);
    res.status(200).json({ success: true, data: { profiles } });
  }

  async userProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await playersService.getUserProfiles(req.params.userId);
    res.status(200).json({ success: true, data: { profiles } });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const profile = await playersService.updatePlayerProfile(
      req.user!.id,
      req.params.id,
      req.body,
    );
    res.status(200).json({
      success: true,
      message: 'Sport profile updated',
      data: { profile },
    });
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    await playersService.deletePlayerProfile(req.user!.id, req.params.id);
    res.status(200).json({ success: true, message: 'Sport profile deleted' });
  }
}

export const playersController = new PlayersController();
