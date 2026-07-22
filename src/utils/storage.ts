import { getSupabaseAdmin } from '../config/supabase';
import { config } from '../config/config';
import { BadRequestError } from './errors';
import { Logger } from './logger';

export type StorageBucket = 'avatars' | 'team-logos' | 'support-tickets';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

export function assertImageMime(mimeType: string): void {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new BadRequestError('Unsupported image type. Use jpeg, png, webp, or gif');
  }
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

/**
 * Upload a buffer to a public Supabase Storage bucket and return the public URL.
 */
export async function uploadToSupabase(params: {
  bucket: StorageBucket;
  path: string;
  buffer: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<string> {
  assertImageMime(params.contentType);
  if (params.buffer.length === 0) {
    throw new BadRequestError('Empty image file');
  }
  if (params.buffer.length > MAX_BYTES) {
    throw new BadRequestError('Image must be under 5MB');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(params.bucket).upload(params.path, params.buffer, {
    contentType: params.contentType,
    upsert: params.upsert ?? true,
  });

  if (error) {
    Logger.error('Supabase storage upload failed', error);
    throw new BadRequestError(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
  if (!data?.publicUrl) {
    throw new BadRequestError('Failed to resolve public URL for uploaded image');
  }

  Logger.info('Uploaded to Supabase Storage', {
    bucket: params.bucket,
    path: params.path,
  });

  return data.publicUrl;
}

/** Best-effort delete; ignores missing objects. */
export async function deleteFromSupabase(bucket: StorageBucket, path: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(bucket).remove([path]);
  } catch (error) {
    Logger.warn('Supabase storage delete failed', { bucket, path, error });
  }
}

export function storagePublicBaseUrl(): string {
  return `${config.supabase.url.replace(/\/$/, '')}/storage/v1/object/public`;
}
