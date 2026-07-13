import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { statisticsController } from './statistics.controller';
import {
  playerLeaderboardQuerySchema,
  playerStatsParamSchema,
  playerStatsQuerySchema,
  teamLeaderboardQuerySchema,
  teamStatsParamSchema,
} from './statistics.validators';

const router = Router();

router.get(
  '/players/leaderboard',
  validate(playerLeaderboardQuerySchema, 'query'),
  asyncHandler(statisticsController.getPlayerLeaderboard.bind(statisticsController)),
);

router.get(
  '/players/:userId',
  validate(playerStatsParamSchema, 'params'),
  validate(playerStatsQuerySchema, 'query'),
  asyncHandler(statisticsController.getPlayerStats.bind(statisticsController)),
);

router.get(
  '/teams/leaderboard',
  validate(teamLeaderboardQuerySchema, 'query'),
  asyncHandler(statisticsController.getTeamLeaderboard.bind(statisticsController)),
);

router.get(
  '/teams/:teamId',
  validate(teamStatsParamSchema, 'params'),
  asyncHandler(statisticsController.getTeamStats.bind(statisticsController)),
);

export default router;
