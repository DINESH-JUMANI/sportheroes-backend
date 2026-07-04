import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { authController } from './auth.controller';
import { loginSchema, updateProfileSchema } from './auth.validators';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login or register with Firebase phone auth
 *     description: |
 *       Flutter completes Firebase Phone Auth (OTP), then sends the Firebase ID token here.
 *       The backend verifies the token, creates the user on first login, and returns an app JWT
 *       valid for AUTH_TOKEN_EXPIRY_DAYS (default 7 days).
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
 *                 description: Firebase ID token from the Flutter Firebase Auth SDK
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
 *     responses:
 *       200:
 *         description: Existing user logged in
 *       201:
 *         description: New user created and logged in
 *       401:
 *         description: Invalid Firebase token
 */
router.post('/login', validate(loginSchema), asyncHandler(authController.login.bind(authController)));

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Missing or invalid access token
 */
router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

/**
 * @openapi
 * /api/v1/auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update the authenticated user profile
 *     description: |
 *       Call this after first login when `isNewUser` / `isProfileComplete` is false
 *       so the user can set their real name and profile details.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Rahul Sharma
 *               displayName:
 *                 type: string
 *                 example: Rahul
 *               email:
 *                 type: string
 *                 format: email
 *               profilePictureUrl:
 *                 type: string
 *                 format: uri
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1998-05-12
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid access token
 */
router.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile.bind(authController)),
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (client-side token discard)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout acknowledged
 *       401:
 *         description: Missing or invalid access token
 */
router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));

export default router;
