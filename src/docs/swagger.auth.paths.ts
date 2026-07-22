/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register with email and/or phone + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, fullName]
 *             properties:
 *               email: { type: string, example: user@example.com }
 *               phoneNumber: { type: string, example: '+919000000001' }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *     responses:
 *       201:
 *         description: Account created + app JWT
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *
 * /api/v1/auth/check:
 *   post:
 *     tags: [Auth]
 *     summary: Check if an account exists and has a password (login step 1)
 *     description: |
 *       Public endpoint — no auth token. Send either `email` or `phoneNumber`.
 *       Used by FE before showing password field, set-password screen, or register.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: user@example.com }
 *               phoneNumber: { type: string, example: '+919000000001' }
 *     responses:
 *       200:
 *         description: Account check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Account check completed }
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists: { type: boolean }
 *                     hasPassword: { type: boolean }
 *
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email or phone + password
 *     description: |
 *       Send either `email` or `phoneNumber` plus `password`.
 *       If the user exists but has no password (added via teams/matches), returns 400 `PASSWORD_NOT_SET`
 *       — FE should call POST /auth/set-password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful + app JWT
 *       400:
 *         description: PASSWORD_NOT_SET — redirect to set-password
 *       401:
 *         description: Invalid credentials
 *
 * /api/v1/auth/set-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set password for users without one (placeholder accounts)
 *     description: Used when a user was added via team/match and passwordHash is null.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *     responses:
 *       200:
 *         description: Password set + app JWT
 *       400:
 *         description: Password already set
 *       404:
 *         description: User not found
 *
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using current password (no OTP)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password reset + new app JWT
 *       401:
 *         description: Invalid current password
 *
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password while logged in
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/auth/dev-login:
 *   post:
 *     tags: [Auth]
 *     summary: "[DEV ONLY] Get 1-year JWT for seeded test user"
 *     responses:
 *       200:
 *         description: Dev token issued
 *       403:
 *         description: Disabled in production
 *
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user (includes hasPassword)
 *
 * /api/v1/auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update profile fields
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               displayName: { type: string, nullable: true }
 *               email: { type: string, nullable: true }
 *               phoneNumber: { type: string, nullable: true }
 *               profilePictureUrl: { type: string, nullable: true }
 *               dateOfBirth: { type: string }
 *               gender: { type: string, enum: [male, female, other, prefer_not_to_say] }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/v1/auth/avatar:
 *   post:
 *     tags: [Auth]
 *     summary: Upload profile avatar to Supabase Storage
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (client discards app JWT)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out
 */
