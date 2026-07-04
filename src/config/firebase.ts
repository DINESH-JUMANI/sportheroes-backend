import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { Logger } from '../utils/logger';
import { config } from './config';

/**
 * Initializes the Firebase Admin SDK once using service-account credentials from env.
 */
export function initFirebase(): void {
  if (getApps().length > 0) {
    Logger.debug('Firebase Admin SDK already initialized');
    return;
  }

  const { projectId, clientEmail, privateKey } = config.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    Logger.warn('Skipping Firebase Admin SDK init — credentials not configured');
    return;
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  Logger.info('Firebase Admin SDK initialized', { projectId });
}

export function getFirebaseAuth(): Auth {
  if (getApps().length === 0) {
    initFirebase();
  }

  if (getApps().length === 0) {
    throw new Error('Firebase Admin SDK is not configured. Set FIREBASE_* env variables.');
  }

  return getAuth();
}
