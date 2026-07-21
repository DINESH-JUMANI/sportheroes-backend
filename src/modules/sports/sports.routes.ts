import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { sportsController } from './sports.controller';
import {
  createSportSchema,
  listSportsQuerySchema,
  sportCodeParamSchema,
  updateSportSchema,
} from './sports.validators';

const router = Router();

router.get(
  '/',
  validate(listSportsQuerySchema, 'query'),
  asyncHandler(sportsController.list.bind(sportsController)),
);
router.get(
  '/code/:code',
  validate(sportCodeParamSchema, 'params'),
  asyncHandler(sportsController.getByCode.bind(sportsController)),
);
router.get(
  '/code/:code/rules',
  validate(sportCodeParamSchema, 'params'),
  asyncHandler(sportsController.getRulesByCode.bind(sportsController)),
);
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(sportsController.getById.bind(sportsController)),
);

router.post(
  '/',
  authenticate,
  validate(createSportSchema),
  asyncHandler(sportsController.create.bind(sportsController)),
);
router.patch(
  '/:id',
  authenticate,
  validate(uuidParamSchema, 'params'),
  validate(updateSportSchema),
  asyncHandler(sportsController.update.bind(sportsController)),
);
router.delete(
  '/:id',
  authenticate,
  validate(uuidParamSchema, 'params'),
  asyncHandler(sportsController.remove.bind(sportsController)),
);

export default router;
