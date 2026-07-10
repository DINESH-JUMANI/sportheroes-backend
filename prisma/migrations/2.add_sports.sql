-- Migration 2: Sports and Player Sport Profiles
-- Run: npm run db:migrate -- 2.add_sports.sql

-- Create sports table
CREATE TABLE IF NOT EXISTS sports (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(50) UNIQUE NOT NULL,
    code                  VARCHAR(10) UNIQUE NOT NULL,
    icon_url              TEXT,
    description           TEXT,
    is_team_sport         BOOLEAN DEFAULT false,
    default_match_format  JSONB NOT NULL,
    is_active             BOOLEAN DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Create player sport profiles table
CREATE TABLE IF NOT EXISTS player_sport_profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id          UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    ranking_points    INTEGER DEFAULT 0,
    is_primary_sport  BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, sport_id)
);

CREATE INDEX IF NOT EXISTS idx_player_sport_profiles_user ON player_sport_profiles(user_id);

-- Seed sports data
INSERT INTO sports (name, code, is_team_sport, default_match_format) VALUES
('Table Tennis', 'TT',  false, '{"sets_to_win": 3, "best_of_sets": 5, "points_per_set": 11, "win_by_margin": 2, "deuce_enabled": true}'),
('Badminton',    'BAD', false, '{"sets_to_win": 2, "best_of_sets": 3, "points_per_set": 21, "win_by_margin": 2, "deuce_enabled": true}'),
('Volleyball',   'VB',  true,  '{"sets_to_win": 3, "best_of_sets": 5, "points_per_set": 25, "deciding_set_points": 15, "win_by_margin": 2}'),
('Pickleball',   'PBL', false, '{"sets_to_win": 2, "best_of_sets": 3, "points_per_set": 11, "win_by_margin": 2}')
ON CONFLICT (name) DO NOTHING;
