/**
 * @openapi
 * /api/v1/tournaments:
 *   get:
 *     tags: [Tournaments]
 *     summary: List tournaments
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, registration_open, registration_closed, ongoing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Paginated tournaments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournaments:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Tournament' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *   post:
 *     tags: [Tournaments]
 *     summary: Create tournament
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportId, name, format, participantKind, startDate]
 *             properties:
 *               sportId: { type: string, format: uuid }
 *               name: { type: string, example: Mumbai Open 2026 }
 *               format: { type: string, enum: [league, round_robin, knockout] }
 *               participantKind: { type: string, enum: [individual, team] }
 *               bannerUrl: { type: string }
 *               description: { type: string }
 *               venue: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               registrationStartDate: { type: string, format: date }
 *               registrationEndDate: { type: string, format: date }
 *               startDate: { type: string, format: date, example: "2026-07-20" }
 *               endDate: { type: string, format: date }
 *               maxParticipants: { type: integer, example: 32 }
 *     responses:
 *       201:
 *         description: Created
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
 *                     tournament: { $ref: '#/components/schemas/Tournament' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tournament details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournament: { $ref: '#/components/schemas/Tournament' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Tournaments]
 *     summary: Update tournament
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
 *             description: Same fields as create (all optional)
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}/status:
 *   patch:
 *     tags: [Tournaments]
 *     summary: Update tournament status
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, registration_open, registration_closed, ongoing, completed, cancelled]
 *                 example: registration_open
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}/participants:
 *   get:
 *     tags: [Tournaments]
 *     summary: List tournament participants
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     participants:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/TournamentParticipant' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Tournaments]
 *     summary: Register participant
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
 *               userId: { type: string, format: uuid, description: For individual tournaments }
 *               teamId: { type: string, format: uuid, description: For team tournaments }
 *               seedNumber: { type: integer }
 *     responses:
 *       201:
 *         description: Registered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}/participants/{participantId}:
 *   patch:
 *     tags: [Tournaments]
 *     summary: Update participant
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [registered, confirmed, withdrawn, disqualified] }
 *               seedNumber: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}/rounds:
 *   get:
 *     tags: [Tournaments]
 *     summary: List tournament rounds
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Rounds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     rounds:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/TournamentRound' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   post:
 *     tags: [Tournaments]
 *     summary: Create tournament round
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
 *             required: [roundNumber, roundName]
 *             properties:
 *               roundNumber: { type: integer, example: 1 }
 *               roundName: { type: string, example: Quarterfinal }
 *     responses:
 *       201:
 *         description: Round created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/tournaments/{id}/standings:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament standings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Standings table
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     standings:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/TournamentStanding' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export {};
