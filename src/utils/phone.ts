import { randomUUID } from 'crypto';

/**
 * Normalize phone numbers for lookup and storage.
 * Strips spaces/dashes; ensures leading + when digits-only with country code.
 */
export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim().replace(/[\s\-()]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (/^\d{10,15}$/.test(trimmed)) return `+${trimmed}`;
  return trimmed;
}

/** Placeholder auth uid for users added by phone before they set a password. */
export function placeholderAuthUid(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return `pending_phone_${normalized.replace(/[^0-9+]/g, '')}`;
}

export function isPlaceholderAuthUid(authUid: string): boolean {
  return authUid.startsWith('pending_phone_');
}

export function localAuthUid(): string {
  return `local_${randomUUID()}`;
}
