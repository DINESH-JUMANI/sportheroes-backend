import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { sportsController } from './sports.controller';
import {
  createPlayerProfileSchema,
  listSportsQuerySchema,
  sportCodeParamSchema,
  updatePlayerProfileSchema,
  userIdParamSchema,
} from './sports.validators';

const router = Router();

router.get('/', validate(listSportsQuerySchema, 'query'), asyncHandler(sportsController.list.bind(sportsController)));
router.get('/code/:code', validate(sportCodeParamSchema, 'params'), asyncHandler(sportsController.getByCode.bind(sportsController)));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(sportsController.getById.bind(sportsController)));

const profilesRouter = Router();
profilesRouter.use(authenticate);
profilesRouter.post('/', validate(createPlayerProfileSchema), asyncHandler(sportsController.createProfile.bind(sportsController)));
profilesRouter.get('/me', asyncHandler(sportsController.myProfiles.bind(sportsController)));
profilesRouter.get('/user/:userId', validate(userIdParamSchema, 'params'), asyncHandler(sportsController.userProfiles.bind(sportsController)));
profilesRouter.patch('/:id', validate(uuidParamSchema, 'params'), validate(updatePlayerProfileSchema), asyncHandler(sportsController.updateProfile.bind(sportsController)));
profilesRouter.delete('/:id', validate(uuidParamSchema, 'params'), asyncHandler(sportsController.deleteProfile.bind(sportsController)));

export { router as sportsRoutes, profilesRouter as playerProfilesRoutes };
