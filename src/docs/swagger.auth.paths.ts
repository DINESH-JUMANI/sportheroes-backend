/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login or register with Firebase phone auth
 *     description: Flutter sends Firebase ID token after OTP. Returns app JWT (default 7 days).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token from Flutter Firebase Auth SDK
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *     responses:
 *       200:
 *         description: Existing user logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Login successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isNewUser: { type: boolean, example: false }
 *                     user: { $ref: '#/components/schemas/User' }
 *                     tokens: { $ref: '#/components/schemas/AuthTokens' }
 *       201:
 *         description: New user created and logged in
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: INVALID_FIREBASE_TOKEN
 *                 message: Invalid or expired Firebase ID token
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /api/v1/auth/dev-login:
 *   post:
 *     tags: [Auth]
 *     summary: "[DEV ONLY] Get 1-year JWT for seeded test user"
 *     description: |
 *       **Development only** (`NODE_ENV=development`). No Firebase required.
 *       Run `npm run db:seed:dev` first to seed the test user.
 *       Returns a JWT valid for 365 days — use in Swagger Authorize button.
 *     responses:
 *       200:
 *         description: Dev token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Dev login successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isNewUser: { type: boolean, example: false }
 *                     user: { $ref: '#/components/schemas/User' }
 *                     tokens:
 *                       allOf:
 *                         - $ref: '#/components/schemas/AuthTokens'
 *                       example:
 *                         accessToken: eyJhbGciOiJIUzI1NiIs...
 *                         tokenType: Bearer
 *                         expiresIn: 365d
 *                         expiresAt: "2027-07-13T00:00:00.000Z"
 *       403:
 *         description: Not available in production
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/v1/auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update authenticated user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: Rahul Sharma }
 *               displayName: { type: string, example: Rahul }
 *               email: { type: string, format: email }
 *               profilePictureUrl: { type: string, format: uri }
 *               dateOfBirth: { type: string, format: date, example: "1998-05-12" }
 *               gender: { type: string, enum: [male, female, other, prefer_not_to_say] }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
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
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (client discards token)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

export {};
