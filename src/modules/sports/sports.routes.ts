import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { sportsController } from './sports.controller';

const router = Router();

/**
 * @openapi
 * /api/v1/sports:
 *   get:
 *     tags: [Sports]
 *     summary: Retrieve all supported sports
 *     description: Returns a list of all active sports and their default match rules.
 *     responses:
 *       200:
 *         description: List of active sports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       iconUrl:
 *                         type: string
 *                         nullable: true
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       isTeamSport:
 *                         type: boolean
 *                       defaultMatchFormat:
 *                         type: object
 *                       isActive:
 *                         type: boolean
 */
router.get('/', asyncHandler(sportsController.getAll.bind(sportsController)));

/**
 * @openapi
 * /api/v1/sports/{idOrCode}:
 *   get:
 *     tags: [Sports]
 *     summary: Get a specific sport configuration
 *     description: Retrieve a sport detail by its UUID or its unique code (e.g. TT, BAD).
 *     parameters:
 *       - name: idOrCode
 *         in: path
 *         required: true
 *         description: UUID of the sport or short code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sport details retrieved successfully
 *       404:
 *         description: Sport not found
 */
router.get('/:idOrCode', asyncHandler(sportsController.getOne.bind(sportsController)));

export default router;
