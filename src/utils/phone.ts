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

export function placeholderFirebaseUid(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return `pending_phone_${normalized.replace(/[^0-9+]/g, '')}`;
}

export function isPlaceholderFirebaseUid(firebaseUid: string): boolean {
  return firebaseUid.startsWith('pending_phone_');
}
