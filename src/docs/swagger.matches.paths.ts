/**
 * @openapi
 * /api/v1/matches:
 *   get:
 *     tags: [Matches]
 *     summary: List matches
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sportId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: tournamentId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, paused, completed, cancelled]
 *       - in: query
 *         name: createdBy
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Match' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *   post:
 *     tags: [Matches]
 *     summary: Create match
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportId, matchType, participants]
 *             properties:
 *               sportId: { type: string, format: uuid }
 *               tournamentId: { type: string, format: uuid, nullable: true }
 *               tournamentRoundId: { type: string, format: uuid, nullable: true }
 *               matchType: { type: string, enum: [singles, doubles, team] }
 *               venue: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               participants:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   required: [side]
 *                   properties:
 *                     side: { type: string, enum: [A, B] }
 *                     userId: { type: string, format: uuid }
 *                     teamId: { type: string, format: uuid }
 *           example:
 *             sportId: "00000000-0000-0000-0000-000000000001"
 *             matchType: singles
 *             participants:
 *               - { side: A, userId: "a0000000-0000-4000-8000-000000000001" }
 *               - { side: B, userId: "a0000000-0000-4000-8000-000000000002" }
 *     responses:
 *       201:
 *         description: Match created
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
 *                     match: { $ref: '#/components/schemas/Match' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match (poll for live scores)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Match with participants and sets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     match: { $ref: '#/components/schemas/Match' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/timeline:
 *   get:
 *     tags: [Matches]
 *     summary: Get point-by-point timeline
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Timeline
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeline:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MatchPoint' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/start:
 *   post:
 *     tags: [Matches]
 *     summary: Start match (scheduled → ongoing)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Match started
 *       400:
 *         description: Invalid status transition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/pause:
 *   post:
 *     tags: [Matches]
 *     summary: Pause match (ongoing → paused)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Match paused
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/resume:
 *   post:
 *     tags: [Matches]
 *     summary: Resume match (paused → ongoing)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Match resumed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/point:
 *   post:
 *     tags: [Matches]
 *     summary: Record a point
 *     description: Only when status is `ongoing`. Auto-completes match when a side wins enough sets.
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
 *             required: [scoringSide]
 *             properties:
 *               scoringSide: { type: string, enum: [A, B] }
 *     responses:
 *       200:
 *         description: Point recorded (may include completed match)
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
 *                     match: { $ref: '#/components/schemas/Match' }
 *       400:
 *         description: Match not ongoing or already decided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/undo-point:
 *   post:
 *     tags: [Matches]
 *     summary: Undo last point
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Point undone, scores recalculated
 *       400:
 *         description: No points to undo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/complete:
 *   post:
 *     tags: [Matches]
 *     summary: Manually complete match
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Match completed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/matches/{id}/cancel:
 *   post:
 *     tags: [Matches]
 *     summary: Cancel match
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
 *               reason: { type: string, example: Player no-show }
 *     responses:
 *       200:
 *         description: Match cancelled
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export {};
