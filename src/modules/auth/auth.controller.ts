import { Request, Response } from 'express';
import { Logger } from '../../utils/logger';
import { authService } from './auth.service';
import type { LoginInput, UpdateProfileInput } from './auth.validators';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.login called');
    const result = await authService.loginWithFirebase(req.body as LoginInput);

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: result.isNewUser ? 'Account created successfully' : 'Login successful',
      data: result,
    });
  }

  async me(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.me called', { userId: req.user?.id });
    const user = await authService.getMe(req.user!.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.updateProfile called', { userId: req.user?.id });
    const user = await authService.updateProfile(req.user!.id, req.body as UpdateProfileInput);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    Logger.info('User logged out', { userId: req.user?.id });
    // Stateless JWT — client discards the token. Endpoint exists for a consistent client flow.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Discard the access token on the client.',
    });
  }

  async devLogin(_req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.devLogin called');
    const result = await authService.devLogin();

    res.status(200).json({
      success: true,
      message: 'Dev login successful — token valid for 365 days',
      data: result,
    });
  }
}

export const authController = new AuthController();
