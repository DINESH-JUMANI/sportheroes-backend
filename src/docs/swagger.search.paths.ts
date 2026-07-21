/**
 * @openapi
 * /api/v1/search:
 *   get:
 *     tags: [Search]
 *     summary: Global search across users, teams, tournaments, matches, and venues
 *     description: Case-insensitive search by name, phone number, venue, or other text fields.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, example: mumbai }
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *           example: users,teams,tournaments
 *         description: Comma-separated types. Default searches all types.
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type: { type: string, enum: [user, team, tournament, match, venue] }
 *                           id: { type: string }
 *                           title: { type: string }
 *                           subtitle: { type: string, nullable: true }
 *                           meta: { type: object, additionalProperties: { type: string, nullable: true } }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *                         query: { type: string }
 *                         types: { type: array, items: { type: string } }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

export {};
