/**
 * @openapi
 * /api/v1/venues:
 *   get:
 *     tags: [Venues]
 *     summary: List venues
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name, address, city
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string, enum: [true, false], default: true }
 *     responses:
 *       200:
 *         description: Paginated venues
 *   post:
 *     tags: [Venues]
 *     summary: Create venue with GPS coordinates
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, latitude, longitude]
 *             properties:
 *               name: { type: string, example: Mumbai Sports Complex }
 *               latitude: { type: number, example: 19.076 }
 *               longitude: { type: number, example: 72.8777 }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *     responses:
 *       201:
 *         description: Venue created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/venues/{id}:
 *   get:
 *     tags: [Venues]
 *     summary: Get venue by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Venue found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Venues]
 *     summary: Update venue (creator only)
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
 *               name: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               address: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Venues]
 *     summary: Soft-delete venue (creator only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */

export {};
