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
 *   post:
 *     tags: [Sports]
 *     summary: Create a sport
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, defaultMatchFormat]
 *             properties:
 *               name: { type: string, example: Tennis }
 *               code: { type: string, example: TEN }
 *               iconUrl: { type: string, format: uri, nullable: true }
 *               description: { type: string, nullable: true }
 *               isTeamSport: { type: boolean, default: false }
 *               isActive: { type: boolean, default: true }
 *               defaultMatchFormat:
 *                 $ref: '#/components/schemas/MatchFormat'
 *           example:
 *             name: Tennis
 *             code: TEN
 *             isTeamSport: false
 *             description: Racket sport played on a court
 *             defaultMatchFormat:
 *               sets_to_win: 2
 *               best_of_sets: 3
 *               points_per_set: 6
 *               win_by_margin: 2
 *               deuce_enabled: true
 *     responses:
 *       201:
 *         description: Sport created
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
 *                     sport: { $ref: '#/components/schemas/Sport' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
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
 * /api/v1/sports/code/{code}/rules:
 *   get:
 *     tags: [Sports]
 *     summary: Get sport-specific rules and scoring config
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string, example: VB }
 *     responses:
 *       200:
 *         description: Sport rules
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
 *   patch:
 *     tags: [Sports]
 *     summary: Update a sport
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               iconUrl: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               isTeamSport: { type: boolean }
 *               isActive: { type: boolean }
 *               defaultMatchFormat:
 *                 $ref: '#/components/schemas/MatchFormat'
 *     responses:
 *       200:
 *         description: Sport updated
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
 *                     sport: { $ref: '#/components/schemas/Sport' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     tags: [Sports]
 *     summary: Soft-delete a sport (sets isActive=false)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sport deactivated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export {};
