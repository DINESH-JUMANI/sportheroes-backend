import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { searchController } from './search.controller';
import { searchQuerySchema, searchUsersQuerySchema } from './search.validators';

const router = Router();

router.get(
  '/',
  validate(searchQuerySchema, 'query'),
  asyncHandler(searchController.search.bind(searchController)),
);

/** Participant typeahead — name / phone / email (auth required). */
router.get(
  '/users',
  authenticate,
  validate(searchUsersQuerySchema, 'query'),
  asyncHandler(searchController.searchUsers.bind(searchController)),
);

export default router;
