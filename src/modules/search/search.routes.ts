import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { searchController } from './search.controller';
import { searchQuerySchema } from './search.validators';

const router = Router();

router.get(
  '/',
  validate(searchQuerySchema, 'query'),
  asyncHandler(searchController.search.bind(searchController)),
);

export default router;
