import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { venuesController } from './venues.controller';
import {
  createVenueSchema,
  listVenuesQuerySchema,
  updateVenueSchema,
} from './venues.validators';

const router = Router();

router.get(
  '/',
  validate(listVenuesQuerySchema, 'query'),
  asyncHandler(venuesController.list.bind(venuesController)),
);
router.get(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(venuesController.getById.bind(venuesController)),
);

router.use(authenticate);
router.post('/', validate(createVenueSchema), asyncHandler(venuesController.create.bind(venuesController)));
router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateVenueSchema),
  asyncHandler(venuesController.update.bind(venuesController)),
);
router.delete(
  '/:id',
  validate(uuidParamSchema, 'params'),
  asyncHandler(venuesController.remove.bind(venuesController)),
);

export default router;
