import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { authController } from './auth.controller';
import { loginSchema, updateProfileSchema } from './auth.validators';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/dev-login', asyncHandler(authController.devLogin.bind(authController)));
router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile.bind(authController)),
);
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

export default router;
