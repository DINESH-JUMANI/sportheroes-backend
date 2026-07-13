/**
 * @openapi
 * /api/v1/sports:
 *   get:
 *     tags: [Sports]
 *     summary: List all sports
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string, enum: [true, false], default: true }
 *     responses:
 *       200:
 *         description: Paginated sports list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sports:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Sport' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 * /api/v1/sports/code/{code}:
 *   get:
 *     tags: [Sports]
 *     summary: Get sport by code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string, example: TT }
 *     responses:
 *       200:
 *         description: Sport found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sport: { $ref: '#/components/schemas/Sport' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/sports/{id}:
 *   get:
 *     tags: [Sports]
 *     summary: Get sport by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sport found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sport: { $ref: '#/components/schemas/Sport' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/player-profiles:
 *   post:
 *     tags: [Sports]
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
 *     tags: [Sports]
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
 *     tags: [Sports]
 *     summary: Get sport profiles for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User profiles
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/player-profiles/{id}:
 *   patch:
 *     tags: [Sports]
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
 *     tags: [Sports]
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

export {};
