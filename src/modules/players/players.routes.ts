import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { playersController } from './players.controller';
import {
  createPlayerProfileSchema,
  updatePlayerProfileSchema,
  userIdParamSchema,
} from './players.validators';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createPlayerProfileSchema),
  asyncHandler(playersController.createProfile.bind(playersController)),
);
router.get('/me', asyncHandler(playersController.myProfiles.bind(playersController)));
router.get(
  '/user/:userId',
  validate(userIdParamSchema, 'params'),
  asyncHandler(playersController.userProfiles.bind(playersController)),
);
router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updatePlayerProfileSchema),
  asyncHandler(playersController.updateProfile.bind(playersController)),
);
router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(playersController.deleteProfile.bind(playersController)),
);

export default router;
