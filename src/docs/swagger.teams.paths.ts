/**
 * @openapi
 * /api/v1/teams:
 *   get:
 *     tags: [Teams]
 *     summary: List teams (sport-agnostic)
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
 *         description: Paginated teams
 *   post:
 *     tags: [Teams]
 *     summary: Create team (creator becomes admin; not tied to a sport)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Mumbai Smashers }
 *               shortName: { type: string, example: MSM }
 *               description: { type: string }
 *               logoBase64: { type: string, description: Base64-encoded image }
 *               logoMimeType: { type: string, enum: [image/jpeg, image/png, image/webp, image/gif] }
 *     responses:
 *       201:
 *         description: Team created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/teams/lookup-user:
 *   get:
 *     tags: [Teams]
 *     summary: Lookup user by phone number before adding to team
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: phoneNumber
 *         required: true
 *         schema: { type: string, example: '+919999999999' }
 *     responses:
 *       200:
 *         description: Lookup result
 *
 * /api/v1/teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID with roster
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team with roster
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Teams]
 *     summary: Update team details (admin only)
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
 *               shortName: { type: string }
 *               description: { type: string }
 *               logoBase64: { type: string, nullable: true }
 *               logoMimeType: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   delete:
 *     tags: [Teams]
 *     summary: Soft-delete team (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *
 * /api/v1/teams/{id}/logo:
 *   get:
 *     tags: [Teams]
 *     summary: Get team logo image (blob)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Image binary
 *         content:
 *           image/*:
 *             schema: { type: string, format: binary }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Teams]
 *     summary: Upload team logo (admin only)
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
 *             required: [logoBase64, logoMimeType]
 *             properties:
 *               logoBase64: { type: string }
 *               logoMimeType: { type: string, enum: [image/jpeg, image/png, image/webp, image/gif] }
 *     responses:
 *       200:
 *         description: Logo updated
 *
 * /api/v1/teams/{id}/members:
 *   get:
 *     tags: [Teams]
 *     summary: List team members
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Members list
 *   post:
 *     tags: [Teams]
 *     summary: Add member by phone number
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
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber: { type: string, example: '+919999999999' }
 *               fullName: { type: string, description: Required when user not in DB }
 *               role: { type: string, enum: [admin, captain, vice_captain, member], default: member }
 *     responses:
 *       201:
 *         description: Member added
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/v1/teams/{id}/members/{memberId}:
 *   patch:
 *     tags: [Teams]
 *     summary: Update member role (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [admin, captain, vice_captain, member] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Teams]
 *     summary: Remove team member (admin or captain)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Removed
 */

export {};
