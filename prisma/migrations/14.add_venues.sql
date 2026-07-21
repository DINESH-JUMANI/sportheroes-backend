-- Migration 14: Venues master table + optional match.venue_id
-- Run: npm run db:migrate:14

CREATE TABLE IF NOT EXISTS venues (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    address     VARCHAR(255),
    city        VARCHAR(100),
    state       VARCHAR(100),
    country     VARCHAR(100),
    created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues(created_by);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(is_active);

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_venue ON matches(venue_id);
