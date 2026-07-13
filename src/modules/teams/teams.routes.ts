import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { uuidParamSchema } from '../../utils/pagination';
import { teamsController } from './teams.controller';
import {
  addMemberSchema,
  createTeamSchema,
  listTeamsQuerySchema,
  updateMemberSchema,
  updateTeamSchema,
} from './teams.validators';
import { z } from 'zod';

const memberIdParamSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
});

const router = Router();

router.get('/', validate(listTeamsQuerySchema, 'query'), asyncHandler(teamsController.list.bind(teamsController)));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(teamsController.getById.bind(teamsController)));
router.get('/:id/members', validate(uuidParamSchema, 'params'), asyncHandler(teamsController.listMembers.bind(teamsController)));

router.use(authenticate);
router.post('/', validate(createTeamSchema), asyncHandler(teamsController.create.bind(teamsController)));
router.patch('/:id', validate(uuidParamSchema, 'params'), validate(updateTeamSchema), asyncHandler(teamsController.update.bind(teamsController)));
router.delete('/:id', validate(uuidParamSchema, 'params'), asyncHandler(teamsController.remove.bind(teamsController)));
router.post('/:id/members', validate(uuidParamSchema, 'params'), validate(addMemberSchema), asyncHandler(teamsController.addMember.bind(teamsController)));
router.patch('/:id/members/:memberId', validate(memberIdParamSchema, 'params'), validate(updateMemberSchema), asyncHandler(teamsController.updateMember.bind(teamsController)));
router.delete('/:id/members/:memberId', validate(memberIdParamSchema, 'params'), asyncHandler(teamsController.removeMember.bind(teamsController)));

export default router;
