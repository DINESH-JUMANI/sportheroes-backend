import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { BadRequestError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { authService } from './auth.service';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SetPasswordInput,
  UpdateProfileInput,
} from './auth.validators';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, 'Account created successfully', result, 201);
  }

  async login(req: Request, res: Response): Promise<void> {
    Logger.debug('AuthController.login called');
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, 'Login successful', result);
  }

  async setPassword(req: Request, res: Response): Promise<void> {
    const result = await authService.setPassword(req.body as SetPasswordInput);
    sendSuccess(res, 'Password set successfully', result);
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const result = await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, 'Password reset successfully', result);
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const user = await authService.changePassword(
      req.user!.id,
      req.body as ChangePasswordInput,
    );
    sendSuccess(res, 'Password changed successfully', { user });
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, 'Profile fetched', { user });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const user = await authService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    sendSuccess(res, 'Profile updated successfully', { user });
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('file is required (multipart field name: file)');
    }
    const user = await authService.uploadAvatar(req.user!.id, req.file);
    sendSuccess(res, 'Avatar uploaded', { user });
  }

  async logout(req: Request, res: Response): Promise<void> {
    Logger.info('User logged out', { userId: req.user?.id });
    await authService.logout();
    sendSuccess(res, 'Logged out successfully. Discard the access token on the client.');
  }

  async devLogin(_req: Request, res: Response): Promise<void> {
    const result = await authService.devLogin();
    sendSuccess(res, 'Dev login successful — token valid for 365 days', result);
  }
}

export const authController = new AuthController();
