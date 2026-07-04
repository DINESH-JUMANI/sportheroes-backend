-- ============================================================================
-- SportHeroes — Full PostgreSQL Schema
-- Two schemas: core (sport-agnostic) + sport_stats (per-sport statistics)
-- Run this file top to bottom on a fresh database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & SCHEMAS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- safety net for gen_random_uuid() on older PG

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS sport_stats;

-- Optional: so you can write "users" instead of "core.users" in a session
-- SET search_path TO core, sport_stats, public;

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES  (all live in core)
-- ----------------------------------------------------------------------------
CREATE TYPE core.gender_type               AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE core.skill_level_type          AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE core.team_role_type            AS ENUM ('captain', 'vice_captain', 'member');
CREATE TYPE core.tournament_format_type    AS ENUM ('league', 'round_robin', 'knockout');
CREATE TYPE core.tournament_participant_kind AS ENUM ('individual', 'team');
CREATE TYPE core.tournament_status_type    AS ENUM
    ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');
CREATE TYPE core.participant_status_type   AS ENUM ('registered', 'confirmed', 'withdrawn', 'disqualified');
CREATE TYPE core.match_type_kind           AS ENUM ('singles', 'doubles', 'team');
CREATE TYPE core.match_status_type         AS ENUM ('scheduled', 'ongoing', 'paused', 'completed', 'cancelled');
CREATE TYPE core.match_side_type           AS ENUM ('A', 'B');

-- ============================================================================
-- 2. CORE SCHEMA — IDENTITY
-- ============================================================================

CREATE TABLE core.users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE,
    phone_number        VARCHAR(20),
    full_name           VARCHAR(150) NOT NULL,
    display_name        VARCHAR(50),
    profile_picture_url TEXT,
    date_of_birth       DATE,
    gender              core.gender_type,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.sports (
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

-- Per-sport allowed scoring events (drives rich stats — see Section: match_points)
CREATE TABLE core.sport_event_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id    UUID NOT NULL REFERENCES core.sports(id) ON DELETE CASCADE,
    code        VARCHAR(30) NOT NULL,          -- 'ace', 'serve_error', 'kill', 'block'
    label       VARCHAR(60) NOT NULL,          -- 'Ace'
    is_positive BOOLEAN NOT NULL DEFAULT true, -- true = scores for the side, false = fault/error
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sport_id, code)
);

CREATE TABLE core.player_sport_profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sport_id          UUID NOT NULL REFERENCES core.sports(id) ON DELETE RESTRICT,
    skill_level       core.skill_level_type DEFAULT 'beginner',
    ranking_points    INTEGER DEFAULT 0,
    is_primary_sport  BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, sport_id)
);

-- ============================================================================
-- 3. CORE SCHEMA — TEAMS
-- ============================================================================

CREATE TABLE core.teams (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id          UUID NOT NULL REFERENCES core.sports(id) ON DELETE RESTRICT,
    name              VARCHAR(100) NOT NULL,
    short_name        VARCHAR(10),
    logo_url          TEXT,
    description       TEXT,
    captain_id        UUID REFERENCES core.users(id) ON DELETE SET NULL,
    vice_captain_id   UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_by        UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    role        core.team_role_type DEFAULT 'member',
    joined_at   TIMESTAMPTZ DEFAULT now(),
    left_at     TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    UNIQUE (team_id, user_id)
);

-- ============================================================================
-- 4. CORE SCHEMA — TOURNAMENTS
-- ============================================================================

CREATE TABLE core.tournaments (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id                 UUID NOT NULL REFERENCES core.sports(id) ON DELETE RESTRICT,
    organizer_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    name                     VARCHAR(150) NOT NULL,
    format                   core.tournament_format_type NOT NULL,
    participant_kind         core.tournament_participant_kind NOT NULL,
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
    status                   core.tournament_status_type DEFAULT 'draft',
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.tournament_participants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES core.tournaments(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES core.users(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES core.teams(id) ON DELETE CASCADE,
    seed_number    INTEGER,
    status         core.participant_status_type DEFAULT 'registered',
    registered_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_participant_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, team_id)
);

CREATE TABLE core.tournament_rounds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES core.tournaments(id) ON DELETE CASCADE,
    round_number   INTEGER NOT NULL,
    round_name     VARCHAR(50) NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tournament_id, round_number)
);

CREATE TABLE core.tournament_standings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES core.tournaments(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES core.users(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES core.teams(id) ON DELETE CASCADE,
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

-- ============================================================================
-- 5. CORE SCHEMA — MATCHES & LIVE SCORING
-- ============================================================================

CREATE TABLE core.matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id            UUID NOT NULL REFERENCES core.sports(id) ON DELETE RESTRICT,
    tournament_id       UUID REFERENCES core.tournaments(id) ON DELETE SET NULL,
    tournament_round_id UUID REFERENCES core.tournament_rounds(id) ON DELETE SET NULL,
    match_type          core.match_type_kind NOT NULL,
    match_format        JSONB NOT NULL,   -- snapshot of sports.default_match_format at creation time
    venue               VARCHAR(200),
    scheduled_at        TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    finished_at         TIMESTAMPTZ,
    status              core.match_status_type DEFAULT 'scheduled',
    winner_side         core.match_side_type,
    created_by          UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.match_participants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES core.matches(id) ON DELETE CASCADE,
    side        core.match_side_type NOT NULL,
    user_id     UUID REFERENCES core.users(id) ON DELETE CASCADE,
    team_id     UUID REFERENCES core.teams(id) ON DELETE CASCADE,
    is_winner   BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_match_participant_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    )
);

CREATE TABLE core.match_sets (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id      UUID NOT NULL REFERENCES core.matches(id) ON DELETE CASCADE,
    set_number    INTEGER NOT NULL,
    side_a_score  INTEGER DEFAULT 0,
    side_b_score  INTEGER DEFAULT 0,
    winner_side   core.match_side_type,
    started_at    TIMESTAMPTZ,
    ended_at      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE (match_id, set_number)
);

-- Point-by-point ledger — typed event + metadata so per-sport stats can be
-- derived from this single generic table (no per-sport event tables needed).
CREATE TABLE core.match_points (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id            UUID NOT NULL REFERENCES core.matches(id) ON DELETE CASCADE,
    match_set_id        UUID NOT NULL REFERENCES core.match_sets(id) ON DELETE CASCADE,
    event_type_id       UUID REFERENCES core.sport_event_types(id) ON DELETE SET NULL,
    point_number        INTEGER NOT NULL,
    scoring_side        core.match_side_type NOT NULL,
    side_a_score_after  INTEGER NOT NULL,
    side_b_score_after  INTEGER NOT NULL,
    metadata            JSONB DEFAULT '{}'::jsonb,   -- e.g. {"shot_zone": "backhand", "rally_length": 7}
    is_undone           BOOLEAN DEFAULT false,
    recorded_by         UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    recorded_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE core.match_status_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id          UUID NOT NULL REFERENCES core.matches(id) ON DELETE CASCADE,
    previous_status   core.match_status_type,
    new_status        core.match_status_type NOT NULL,
    changed_by        UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
    reason            TEXT,
    changed_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 6. CORE SCHEMA — UNIVERSAL STATISTICS (sport-agnostic aggregates)
-- ============================================================================

CREATE TABLE core.player_statistics (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    sport_id               UUID NOT NULL REFERENCES core.sports(id) ON DELETE CASCADE,
    matches_played         INTEGER DEFAULT 0,
    matches_won            INTEGER DEFAULT 0,
    matches_lost           INTEGER DEFAULT 0,
    sets_won               INTEGER DEFAULT 0,
    sets_lost              INTEGER DEFAULT 0,
    total_points_scored    INTEGER DEFAULT 0,
    total_points_conceded  INTEGER DEFAULT 0,
    win_percentage         NUMERIC(5,2) DEFAULT 0,
    current_ranking_points INTEGER DEFAULT 0,
    updated_at             TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, sport_id)
);

CREATE TABLE core.team_statistics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
    matches_played  INTEGER DEFAULT 0,
    matches_won     INTEGER DEFAULT 0,
    matches_lost    INTEGER DEFAULT 0,
    sets_won        INTEGER DEFAULT 0,
    sets_lost       INTEGER DEFAULT 0,
    win_percentage  NUMERIC(5,2) DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (team_id)
);

-- ============================================================================
-- 7. SPORT_STATS SCHEMA — PER-SPORT STATISTICS (physically separated)
-- Each table is a 1:1 extension of core.player_statistics, keyed on user_id.
-- ============================================================================

CREATE TABLE sport_stats.player_table_tennis (
    user_id               UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    total_aces            INTEGER DEFAULT 0,
    total_serve_errors    INTEGER DEFAULT 0,
    total_receive_errors  INTEGER DEFAULT 0,
    total_rallies_won     INTEGER DEFAULT 0,
    longest_win_streak    INTEGER DEFAULT 0,
    current_win_streak    INTEGER DEFAULT 0,
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sport_stats.player_badminton (
    user_id                 UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    total_smash_winners     INTEGER DEFAULT 0,
    total_net_kills         INTEGER DEFAULT 0,
    total_service_faults    INTEGER DEFAULT 0,
    total_unforced_errors   INTEGER DEFAULT 0,
    longest_win_streak      INTEGER DEFAULT 0,
    current_win_streak      INTEGER DEFAULT 0,
    updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sport_stats.player_volleyball (
    user_id              UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    total_kills          INTEGER DEFAULT 0,
    total_blocks         INTEGER DEFAULT 0,
    total_digs           INTEGER DEFAULT 0,
    total_service_aces   INTEGER DEFAULT 0,
    total_attack_errors  INTEGER DEFAULT 0,
    attack_efficiency    NUMERIC(5,2) DEFAULT 0,
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sport_stats.player_pickleball (
    user_id                   UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    total_dinks_won           INTEGER DEFAULT 0,
    total_drives_won          INTEGER DEFAULT 0,
    total_kitchen_violations  INTEGER DEFAULT 0,
    total_unforced_errors     INTEGER DEFAULT 0,
    updated_at                TIMESTAMPTZ DEFAULT now()
);

-- Team-level sport-specific example (volleyball is the team sport most likely
-- to need this at MVP; add others the same way if/when doubles stats matter)
CREATE TABLE sport_stats.team_volleyball (
    team_id              UUID PRIMARY KEY REFERENCES core.teams(id) ON DELETE CASCADE,
    total_kills          INTEGER DEFAULT 0,
    total_blocks         INTEGER DEFAULT 0,
    total_digs           INTEGER DEFAULT 0,
    total_service_aces   INTEGER DEFAULT 0,
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. INDEXES
-- ============================================================================

CREATE INDEX idx_player_sport_profiles_user      ON core.player_sport_profiles(user_id);
CREATE INDEX idx_sport_event_types_sport          ON core.sport_event_types(sport_id);
CREATE INDEX idx_team_members_team                ON core.team_members(team_id);
CREATE INDEX idx_team_members_user                ON core.team_members(user_id);
CREATE INDEX idx_tournament_participants_tournament ON core.tournament_participants(tournament_id);
CREATE INDEX idx_matches_tournament                ON core.matches(tournament_id);
CREATE INDEX idx_matches_status                    ON core.matches(status);
CREATE INDEX idx_matches_sport                     ON core.matches(sport_id);
CREATE INDEX idx_match_participants_match          ON core.match_participants(match_id);
CREATE INDEX idx_match_participants_user           ON core.match_participants(user_id);
CREATE INDEX idx_match_sets_match                  ON core.match_sets(match_id);
CREATE INDEX idx_match_points_match_set            ON core.match_points(match_set_id);
CREATE INDEX idx_match_points_event_type           ON core.match_points(event_type_id);
CREATE INDEX idx_match_points_metadata_gin         ON core.match_points USING GIN (metadata);
CREATE INDEX idx_player_statistics_sport_rank       ON core.player_statistics(sport_id, current_ranking_points DESC);

-- Leaderboard-style indexes on the sport-specific tables (add more as you
-- decide which stat each sport is most often ranked by)
CREATE INDEX idx_tt_aces_rank        ON sport_stats.player_table_tennis(total_aces DESC);
CREATE INDEX idx_badminton_smash_rank ON sport_stats.player_badminton(total_smash_winners DESC);
CREATE INDEX idx_volleyball_kills_rank ON sport_stats.player_volleyball(total_kills DESC);
CREATE INDEX idx_pickleball_dinks_rank ON sport_stats.player_pickleball(total_dinks_won DESC);

-- ============================================================================
-- 9. SEED DATA — the 4 MVP sports + their scoring events
-- ============================================================================

INSERT INTO core.sports (name, code, is_team_sport, default_match_format) VALUES
('Table Tennis', 'TT',  false, '{"sets_to_win": 3, "best_of_sets": 5, "points_per_set": 11, "win_by_margin": 2, "deuce_enabled": true}'),
('Badminton',    'BAD', false, '{"sets_to_win": 2, "best_of_sets": 3, "points_per_set": 21, "win_by_margin": 2, "deuce_enabled": true}'),
('Volleyball',   'VB',  true,  '{"sets_to_win": 3, "best_of_sets": 5, "points_per_set": 25, "deciding_set_points": 15, "win_by_margin": 2}'),
('Pickleball',   'PBL', false, '{"sets_to_win": 2, "best_of_sets": 3, "points_per_set": 11, "win_by_margin": 2}');

-- Table Tennis events
INSERT INTO core.sport_event_types (sport_id, code, label, is_positive)
SELECT s.id, e.code, e.label, e.is_positive FROM core.sports s, (VALUES
    ('point_won',      'Point Won',      true),
    ('ace',            'Ace',            true),
    ('serve_error',    'Serve Error',    false),
    ('receive_error',  'Receive Error',  false),
    ('rally_won',      'Rally Won',      true),
    ('error',          'Unforced Error', false)
) AS e(code, label, is_positive)
WHERE s.code = 'TT';

-- Badminton events
INSERT INTO core.sport_event_types (sport_id, code, label, is_positive)
SELECT s.id, e.code, e.label, e.is_positive FROM core.sports s, (VALUES
    ('point_won',       'Point Won',        true),
    ('smash_winner',    'Smash Winner',     true),
    ('net_kill',        'Net Kill',         true),
    ('service_fault',   'Service Fault',    false),
    ('unforced_error',  'Unforced Error',   false)
) AS e(code, label, is_positive)
WHERE s.code = 'BAD';

-- Volleyball events
INSERT INTO core.sport_event_types (sport_id, code, label, is_positive)
SELECT s.id, e.code, e.label, e.is_positive FROM core.sports s, (VALUES
    ('point_won',      'Point Won',       true),
    ('kill',           'Kill',            true),
    ('block',          'Block',           true),
    ('service_ace',    'Service Ace',     true),
    ('dig',            'Dig',             true),
    ('attack_error',   'Attack Error',    false)
) AS e(code, label, is_positive)
WHERE s.code = 'VB';

-- Pickleball events
INSERT INTO core.sport_event_types (sport_id, code, label, is_positive)
SELECT s.id, e.code, e.label, e.is_positive FROM core.sports s, (VALUES
    ('point_won',            'Point Won',            true),
    ('dink_winner',          'Dink Winner',          true),
    ('drive_winner',         'Drive Winner',         true),
    ('kitchen_violation',    'Kitchen Violation',    false),
    ('unforced_error',       'Unforced Error',       false)
) AS e(code, label, is_positive)
WHERE s.code = 'PBL';

-- ============================================================================
-- Done. Verify with:
--   SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('core','sport_stats') ORDER BY 1,2;
-- ============================================================================
