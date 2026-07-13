import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { matchesController } from './matches.controller';
import {
  cancelMatchSchema,
  createMatchSchema,
  listMatchesQuerySchema,
  recordPointSchema,
} from './matches.validators';

const router = Router();

router.get('/', validate(listMatchesQuerySchema, 'query'), asyncHandler(matchesController.list.bind(matchesController)));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.getById.bind(matchesController)));
router.get('/:id/timeline', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.getTimeline.bind(matchesController)));

router.use(authenticate);
router.post('/', validate(createMatchSchema), asyncHandler(matchesController.create.bind(matchesController)));
router.post('/:id/start', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.start.bind(matchesController)));
router.post('/:id/pause', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.pause.bind(matchesController)));
router.post('/:id/resume', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.resume.bind(matchesController)));
router.post('/:id/point', validate(uuidParamSchema, 'params'), validate(recordPointSchema), asyncHandler(matchesController.recordPoint.bind(matchesController)));
router.post('/:id/undo-point', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.undoPoint.bind(matchesController)));
router.post('/:id/complete', validate(uuidParamSchema, 'params'), asyncHandler(matchesController.complete.bind(matchesController)));
router.post('/:id/cancel', validate(uuidParamSchema, 'params'), validate(cancelMatchSchema), asyncHandler(matchesController.cancel.bind(matchesController)));

export default router;
