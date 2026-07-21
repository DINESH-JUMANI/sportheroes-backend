-- Migration 12: Team logo blob storage + promote creators to admin
-- Run: npm run db:migrate:12

ALTER TABLE teams
    ADD COLUMN IF NOT EXISTS logo_blob BYTEA,
    ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(50);

UPDATE team_members tm
SET role = 'admin'
FROM teams t
WHERE tm.team_id = t.id
  AND tm.user_id = t.created_by
  AND tm.is_active = true
  AND tm.role = 'captain'
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm2
    WHERE tm2.team_id = t.id AND tm2.role = 'admin' AND tm2.is_active = true
  );
