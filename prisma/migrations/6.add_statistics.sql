-- Migration 6: Statistics (leaderboard source tables)
-- Run: npm run db:migrate -- 6.add_statistics.sql

CREATE TABLE IF NOT EXISTS player_statistics (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id              UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    matches_played        INTEGER DEFAULT 0,
    matches_won           INTEGER DEFAULT 0,
    matches_lost          INTEGER DEFAULT 0,
    sets_won              INTEGER DEFAULT 0,
    sets_lost             INTEGER DEFAULT 0,
    total_points_scored   INTEGER DEFAULT 0,
    total_points_conceded INTEGER DEFAULT 0,
    win_percentage        NUMERIC(5,2) DEFAULT 0,
    current_ranking_points INTEGER DEFAULT 0,
    updated_at            TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, sport_id)
);

CREATE TABLE IF NOT EXISTS team_statistics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    matches_played  INTEGER DEFAULT 0,
    matches_won     INTEGER DEFAULT 0,
    matches_lost    INTEGER DEFAULT 0,
    sets_won        INTEGER DEFAULT 0,
    sets_lost       INTEGER DEFAULT 0,
    win_percentage  NUMERIC(5,2) DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (team_id)
);

CREATE INDEX IF NOT EXISTS idx_player_statistics_sport_rank
    ON player_statistics(sport_id, current_ranking_points DESC);
