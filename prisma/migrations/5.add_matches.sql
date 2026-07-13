-- Migration 5: Matches and live scoring
-- Run: npm run db:migrate -- 5.add_matches.sql

CREATE TYPE match_type_kind AS ENUM ('singles', 'doubles', 'team');
CREATE TYPE match_status_type AS ENUM
    ('scheduled', 'ongoing', 'paused', 'completed', 'cancelled');
CREATE TYPE match_side_type AS ENUM ('A', 'B');

CREATE TABLE IF NOT EXISTS matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id            UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    tournament_id       UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_round_id UUID REFERENCES tournament_rounds(id) ON DELETE SET NULL,
    match_type          match_type_kind NOT NULL,
    match_format        JSONB NOT NULL,
    venue               VARCHAR(200),
    scheduled_at        TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    status              match_status_type DEFAULT 'scheduled',
    winner_side         match_side_type,
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_participants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    side        match_side_type NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
    is_winner   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_match_participant_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS match_sets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    set_number    INTEGER NOT NULL,
    side_a_score  INTEGER DEFAULT 0,
    side_b_score  INTEGER DEFAULT 0,
    winner_side   match_side_type,
    started_at    TIMESTAMPTZ,
    ended_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (match_id, set_number)
);

CREATE TABLE IF NOT EXISTS match_points (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id            UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    match_set_id        UUID NOT NULL REFERENCES match_sets(id) ON DELETE CASCADE,
    point_number        INTEGER NOT NULL,
    scoring_side        match_side_type NOT NULL,
    side_a_score_after  INTEGER NOT NULL,
    side_b_score_after  INTEGER NOT NULL,
    is_undone           BOOLEAN DEFAULT false,
    recorded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_status_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    previous_status   match_status_type,
    new_status        match_status_type NOT NULL,
    changed_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason            TEXT,
    changed_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_sets_match ON match_sets(match_id);
CREATE INDEX IF NOT EXISTS idx_match_points_match_set ON match_points(match_set_id);
