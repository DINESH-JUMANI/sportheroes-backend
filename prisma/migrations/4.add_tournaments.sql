-- Migration 4: Tournaments
-- Run: npm run db:migrate -- 4.add_tournaments.sql

CREATE TYPE tournament_format_type AS ENUM ('league', 'round_robin', 'knockout');
CREATE TYPE tournament_participant_kind AS ENUM ('individual', 'team');
CREATE TYPE tournament_status_type AS ENUM
    ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');
CREATE TYPE participant_status_type AS ENUM ('registered', 'confirmed', 'withdrawn', 'disqualified');

CREATE TABLE IF NOT EXISTS tournaments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id                 UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    organizer_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name                     VARCHAR(150) NOT NULL,
    format                   tournament_format_type NOT NULL,
    participant_kind         tournament_participant_kind NOT NULL,
    banner_url               TEXT,
    description              TEXT,
    venue                    VARCHAR(200),
    city                     VARCHAR(100),
    state                    VARCHAR(100),
    country                  VARCHAR(100),
    registration_start_date  DATE,
    registration_end_date    DATE,
    start_date               DATE NOT NULL,
    end_date                 DATE,
    max_participants         INTEGER,
    status                   tournament_status_type DEFAULT 'draft',
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_participants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES teams(id) ON DELETE CASCADE,
    seed_number    INTEGER,
    status         participant_status_type DEFAULT 'registered',
    registered_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_participant_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS tournament_rounds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number   INTEGER NOT NULL,
    round_name     VARCHAR(50) NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tournament_id, round_number)
);

CREATE TABLE IF NOT EXISTS tournament_standings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES teams(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    wins           INTEGER DEFAULT 0,
    losses         INTEGER DEFAULT 0,
    points         INTEGER DEFAULT 0,
    position       INTEGER,
    updated_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_standing_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
