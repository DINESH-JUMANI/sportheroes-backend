-- Migration 17: Password auth (email/phone + password). Supabase Auth removed; Storage stays.
-- Run: npm run db:migrate:17

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Rename opaque auth key away from supabase naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'supabase_uid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_uid'
  ) THEN
    ALTER TABLE users RENAME COLUMN supabase_uid TO auth_uid;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_number_unique
  ON users (phone_number)
  WHERE phone_number IS NOT NULL AND is_active = true;
