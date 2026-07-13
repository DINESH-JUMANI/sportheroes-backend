import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { tournamentsController } from './tournaments.controller';
import {
  createRoundSchema,
  createTournamentSchema,
  listTournamentsQuerySchema,
  registerParticipantSchema,
  updateParticipantSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from './tournaments.validators';

const participantParamSchema = z.object({
  id: z.string().uuid(),
  participantId: z.string().uuid(),
});

const router = Router();

router.get('/', validate(listTournamentsQuerySchema, 'query'), asyncHandler(tournamentsController.list.bind(tournamentsController)));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(tournamentsController.getById.bind(tournamentsController)));
router.get('/:id/participants', validate(uuidParamSchema, 'params'), asyncHandler(tournamentsController.listParticipants.bind(tournamentsController)));
router.get('/:id/rounds', validate(uuidParamSchema, 'params'), asyncHandler(tournamentsController.listRounds.bind(tournamentsController)));
router.get('/:id/standings', validate(uuidParamSchema, 'params'), asyncHandler(tournamentsController.getStandings.bind(tournamentsController)));

router.use(authenticate);
router.post('/', validate(createTournamentSchema), asyncHandler(tournamentsController.create.bind(tournamentsController)));
router.patch('/:id', validate(uuidParamSchema, 'params'), validate(updateTournamentSchema), asyncHandler(tournamentsController.update.bind(tournamentsController)));
router.patch('/:id/status', validate(uuidParamSchema, 'params'), validate(updateTournamentStatusSchema), asyncHandler(tournamentsController.updateStatus.bind(tournamentsController)));
router.post('/:id/participants', validate(uuidParamSchema, 'params'), validate(registerParticipantSchema), asyncHandler(tournamentsController.registerParticipant.bind(tournamentsController)));
router.patch('/:id/participants/:participantId', validate(participantParamSchema, 'params'), validate(updateParticipantSchema), asyncHandler(tournamentsController.updateParticipant.bind(tournamentsController)));
router.post('/:id/rounds', validate(uuidParamSchema, 'params'), validate(createRoundSchema), asyncHandler(tournamentsController.createRound.bind(tournamentsController)));

export default router;
