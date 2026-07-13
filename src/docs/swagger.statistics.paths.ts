/**
 * @openapi
 * /api/v1/statistics/players/leaderboard:
 *   get:
 *     tags: [Statistics]
 *     summary: Player leaderboard by sport
 *     parameters:
 *       - in: query
 *         name: sportId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [ranking_points, win_percentage, matches_played]
 *           default: ranking_points
 *     responses:
 *       200:
 *         description: Leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/PlayerStatistics'
 *                           - type: object
 *                             properties:
 *                               player:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: string }
 *                                   fullName: { type: string }
 *                                   displayName: { type: string }
 *                                   profilePictureUrl: { type: string }
 *                                   city: { type: string }
 *                                   country: { type: string }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *
 * /api/v1/statistics/players/{userId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Player statistics
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: sportId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stats per sport
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/PlayerStatistics' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/statistics/teams/leaderboard:
 *   get:
 *     tags: [Statistics]
 *     summary: Team leaderboard
 *     parameters:
 *       - in: query
 *         name: sportId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [win_percentage, matches_played]
 *           default: win_percentage
 *     responses:
 *       200:
 *         description: Team leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     leaderboard:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/TeamStatistics'
 *                           - type: object
 *                             properties:
 *                               team:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: string }
 *                                   name: { type: string }
 *                                   shortName: { type: string }
 *                                   logoUrl: { type: string }
 *                                   sportId: { type: string }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *
 * /api/v1/statistics/teams/{teamId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Team statistics
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats: { $ref: '#/components/schemas/TeamStatistics' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

export {};
