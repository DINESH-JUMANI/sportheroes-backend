import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { Logger } from '../../utils/logger';
import { authService } from './auth.service';
import type { LoginInput, UpdateProfileInput } from './auth.validators';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.login called');
    const result = await authService.loginWithFirebase(req.body as LoginInput);
    sendSuccess(
      res,
      result.isNewUser ? 'Account created successfully' : 'Login successful',
      result,
      result.isNewUser ? 201 : 200,
    );
  }

  async me(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.me called', { userId: req.user?.id });
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, 'Profile fetched', { user });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.updateProfile called', { userId: req.user?.id });
    const user = await authService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    sendSuccess(res, 'Profile updated successfully', { user });
  }

  async logout(req: Request, res: Response): Promise<void> {
    Logger.info('User logged out', { userId: req.user?.id });
    sendSuccess(res, 'Logged out successfully. Discard the access token on the client.');
  }

  async devLogin(_req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.devLogin called');
    const result = await authService.devLogin();
    sendSuccess(res, 'Dev login successful — token valid for 365 days', result);
  }
}

export const authController = new AuthController();
