import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { playersController } from './players.controller';
import { saveProfileSchema } from './players.validators';

const router = Router();

/**
 * @openapi
 * /api/v1/players/profiles:
 *   get:
 *     tags: [Players]
 *     summary: Get caller's sport profiles
 *     description: Retrieve all sport profiles (skill level, ranking points, etc.) for the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of caller's sport profiles
 *       401:
 *         description: Missing or invalid access token
 */
router.get('/profiles', authenticate, asyncHandler(playersController.getMyProfiles.bind(playersController)));

/**
 * @openapi
 * /api/v1/players/profiles:
 *   post:
 *     tags: [Players]
 *     summary: Create or update a sport profile
 *     description: Set or update the preferences for a specific sport.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportId]
 *             properties:
 *               sportId:
 *                 type: string
 *                 format: uuid
 *               isPrimarySport:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Sport profile saved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid access token
 *       404:
 *         description: Sport not found
 */
router.post('/profiles', authenticate, validate(saveProfileSchema), asyncHandler(playersController.saveProfile.bind(playersController)));

/**
 * @openapi
 * /api/v1/players/{userId}/profiles:
 *   get:
 *     tags: [Players]
 *     summary: Get another user's sport profiles
 *     description: Retrieve all sport profiles for a specific user ID.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User UUID to query
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of user's sport profiles
 *       404:
 *         description: User not found
 */
router.get('/:userId/profiles', asyncHandler(playersController.getUserProfiles.bind(playersController)));

export default router;
