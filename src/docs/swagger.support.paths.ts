/**
 * @openapi
 * /api/v1/support/concerns:
 *   get:
 *     tags: [Support]
 *     summary: List support concerns (dropdown)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string, enum: [true, false], default: true }
 *     responses:
 *       200:
 *         description: Concerns list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   post:
 *     tags: [Support]
 *     summary: Create concern
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, label]
 *             properties:
 *               code: { type: string, example: payments }
 *               label: { type: string, example: Payments }
 *               description: { type: string }
 *               sortOrder: { type: integer }
 *               isOther: { type: boolean }
 *     responses:
 *       201:
 *         description: Concern created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *
 * /api/v1/support/concerns/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get concern by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Concern
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Support]
 *     summary: Update concern
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
 *               label: { type: string }
 *               description: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isOther: { type: boolean }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Concern updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Support]
 *     summary: Soft-delete (deactivate) concern
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Concern deactivated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/support/tickets:
 *   get:
 *     tags: [Support]
 *     summary: List my support tickets
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in_progress, resolved, closed] }
 *       - in: query
 *         name: mineOnly
 *         schema: { type: string, enum: [true, false], default: true }
 *     responses:
 *       200:
 *         description: Tickets list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     tags: [Support]
 *     summary: Create support ticket
 *     description: |
 *       Creates a ticket with auto-generated ticketNumber (e.g. SH-000001).
 *       If concern.isOther is true, otherConcernText is required.
 *       Optional images as base64 (max 5, 5MB each).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [concernId, description]
 *             properties:
 *               concernId: { type: string, format: uuid }
 *               otherConcernText: { type: string, description: Required when concern is Other }
 *               description: { type: string, minLength: 10 }
 *               images:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: object
 *                   required: [imageBase64, mimeType]
 *                   properties:
 *                     imageBase64: { type: string }
 *                     mimeType: { type: string, enum: [image/jpeg, image/png, image/webp, image/gif] }
 *           example:
 *             concernId: "00000000-0000-4000-8000-000000000001"
 *             description: "Unable to start a match after selecting best of 3 sets."
 *             images: []
 *     responses:
 *       201:
 *         description: Ticket created with ticketNumber
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/support/tickets/by-number/{ticketNumber}:
 *   get:
 *     tags: [Support]
 *     summary: Get ticket by ticket number
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: ticketNumber
 *         required: true
 *         schema: { type: string, example: SH-000001 }
 *     responses:
 *       200:
 *         description: Ticket
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/support/tickets/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get ticket by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Ticket
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/support/tickets/{id}/status:
 *   patch:
 *     tags: [Support]
 *     summary: Update ticket status
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
 *               status: { type: string, enum: [open, in_progress, resolved, closed] }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/support/tickets/{id}/images/{imageId}:
 *   get:
 *     tags: [Support]
 *     summary: Download ticket image (raw binary)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Image bytes
 *         content:
 *           image/jpeg: {}
 *           image/png: {}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
