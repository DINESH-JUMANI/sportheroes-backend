-- Migration 13: Decouple teams from sports (sport_id becomes optional)
-- Run: npm run db:migrate:13

ALTER TABLE teams
    ALTER COLUMN sport_id DROP NOT NULL;
