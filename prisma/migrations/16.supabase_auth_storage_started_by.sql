-- Migration 16: Supabase auth uid rename, match started_by, image URLs over blobs
-- Run: npm run db:migrate:16

-- Users: firebase_uid → supabase_uid
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'firebase_uid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'supabase_uid'
  ) THEN
    ALTER TABLE users RENAME COLUMN firebase_uid TO supabase_uid;
  END IF;
END $$;

-- Matches: who started / controls scoring
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS started_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_started_by ON matches(started_by);

-- Backfill: ongoing/paused matches without a scorer → creator
UPDATE matches
SET started_by = created_by
WHERE started_by IS NULL
  AND status IN ('ongoing', 'paused');

-- Support ticket images: prefer URL from Supabase Storage
ALTER TABLE support_ticket_images
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE support_ticket_images
  ALTER COLUMN image_blob DROP NOT NULL;
