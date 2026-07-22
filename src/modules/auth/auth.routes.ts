import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { imageUpload } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  checkAccountSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  setPasswordSchema,
  updateProfileSchema,
} from './auth.validators';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);
router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post(
  '/check',
  validate(checkAccountSchema),
  asyncHandler(authController.checkAccount.bind(authController)),
);
router.post(
  '/set-password',
  validate(setPasswordSchema),
  asyncHandler(authController.setPassword.bind(authController)),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword.bind(authController)),
);
router.post('/dev-login', asyncHandler(authController.devLogin.bind(authController)));

router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile.bind(authController)),
);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController)),
);
router.post(
  '/avatar',
  authenticate,
  imageUpload.single('file'),
  asyncHandler(authController.uploadAvatar.bind(authController)),
);
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

export default router;
