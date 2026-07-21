/**
 * @openapi
 * /api/v1/player-profiles:
 *   post:
 *     tags: [Players]
 *     summary: Create player sport profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportId]
 *             properties:
 *               sportId: { type: string, format: uuid }
 *               skillLevel: { type: string, enum: [beginner, intermediate, advanced, professional], default: beginner }
 *               isPrimarySport: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Profile created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile: { $ref: '#/components/schemas/PlayerSportProfile' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *
 * /api/v1/player-profiles/me:
 *   get:
 *     tags: [Players]
 *     summary: Get my sport profiles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/PlayerSportProfile' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/player-profiles/user/{userId}:
 *   get:
 *     tags: [Players]
 *     summary: Get sport profiles for a user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User profiles
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/player-profiles/{id}:
 *   patch:
 *     tags: [Players]
 *     summary: Update player sport profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skillLevel: { type: string, enum: [beginner, intermediate, advanced, professional] }
 *               isPrimarySport: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Players]
 *     summary: Delete player sport profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export { };
