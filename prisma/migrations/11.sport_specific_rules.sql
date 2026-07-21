-- Migration 11: Sport-specific rule tables (one per sport)
-- Run: npm run db:migrate -- 11.sport_specific_rules.sql

-- 5th MVP sport: Tennis
INSERT INTO sports (name, code, is_team_sport, description, default_match_format, is_active)
VALUES (
    'Tennis',
    'TEN',
    false,
    'Racket sport played on a court with singles and doubles formats',
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":6,"win_by_margin":2,"deuce_enabled":true,"tiebreak_at":6}'::jsonb,
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_match_format = EXCLUDED.default_match_format,
    is_active = true,
    updated_at = now();

CREATE TABLE IF NOT EXISTS sport_rules_table_tennis (
    sport_id              UUID PRIMARY KEY REFERENCES sports(id) ON DELETE CASCADE,
    supports_singles      BOOLEAN NOT NULL DEFAULT true,
    supports_doubles      BOOLEAN NOT NULL DEFAULT true,
    supports_team_matches BOOLEAN NOT NULL DEFAULT false,
    uses_team_roster      BOOLEAN NOT NULL DEFAULT false,
    has_captain           BOOLEAN NOT NULL DEFAULT false,
    has_vice_captain      BOOLEAN NOT NULL DEFAULT false,
    min_roster_size       INT,
    max_roster_size       INT,
    min_players_per_side  INT NOT NULL DEFAULT 1,
    max_players_per_side  INT NOT NULL DEFAULT 2,
    match_format          JSONB NOT NULL,
    scoring_config        JSONB NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sport_rules_badminton (
    sport_id              UUID PRIMARY KEY REFERENCES sports(id) ON DELETE CASCADE,
    supports_singles      BOOLEAN NOT NULL DEFAULT true,
    supports_doubles      BOOLEAN NOT NULL DEFAULT true,
    supports_team_matches BOOLEAN NOT NULL DEFAULT false,
    uses_team_roster      BOOLEAN NOT NULL DEFAULT false,
    has_captain           BOOLEAN NOT NULL DEFAULT false,
    has_vice_captain      BOOLEAN NOT NULL DEFAULT false,
    min_roster_size       INT,
    max_roster_size       INT,
    min_players_per_side  INT NOT NULL DEFAULT 1,
    max_players_per_side  INT NOT NULL DEFAULT 2,
    match_format          JSONB NOT NULL,
    scoring_config        JSONB NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sport_rules_volleyball (
    sport_id              UUID PRIMARY KEY REFERENCES sports(id) ON DELETE CASCADE,
    supports_singles      BOOLEAN NOT NULL DEFAULT false,
    supports_doubles      BOOLEAN NOT NULL DEFAULT false,
    supports_team_matches BOOLEAN NOT NULL DEFAULT true,
    uses_team_roster      BOOLEAN NOT NULL DEFAULT true,
    has_captain           BOOLEAN NOT NULL DEFAULT true,
    has_vice_captain      BOOLEAN NOT NULL DEFAULT true,
    min_roster_size       INT NOT NULL DEFAULT 6,
    max_roster_size       INT NOT NULL DEFAULT 15,
    min_players_per_side  INT NOT NULL DEFAULT 6,
    max_players_per_side  INT NOT NULL DEFAULT 12,
    match_format          JSONB NOT NULL,
    scoring_config        JSONB NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sport_rules_pickleball (
    sport_id              UUID PRIMARY KEY REFERENCES sports(id) ON DELETE CASCADE,
    supports_singles      BOOLEAN NOT NULL DEFAULT true,
    supports_doubles      BOOLEAN NOT NULL DEFAULT true,
    supports_team_matches BOOLEAN NOT NULL DEFAULT false,
    uses_team_roster      BOOLEAN NOT NULL DEFAULT false,
    has_captain           BOOLEAN NOT NULL DEFAULT false,
    has_vice_captain      BOOLEAN NOT NULL DEFAULT false,
    min_roster_size       INT,
    max_roster_size       INT,
    min_players_per_side  INT NOT NULL DEFAULT 1,
    max_players_per_side  INT NOT NULL DEFAULT 2,
    match_format          JSONB NOT NULL,
    scoring_config        JSONB NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sport_rules_tennis (
    sport_id              UUID PRIMARY KEY REFERENCES sports(id) ON DELETE CASCADE,
    supports_singles      BOOLEAN NOT NULL DEFAULT true,
    supports_doubles      BOOLEAN NOT NULL DEFAULT true,
    supports_team_matches BOOLEAN NOT NULL DEFAULT false,
    uses_team_roster      BOOLEAN NOT NULL DEFAULT false,
    has_captain           BOOLEAN NOT NULL DEFAULT false,
    has_vice_captain      BOOLEAN NOT NULL DEFAULT false,
    min_roster_size       INT,
    max_roster_size       INT,
    min_players_per_side  INT NOT NULL DEFAULT 1,
    max_players_per_side  INT NOT NULL DEFAULT 2,
    match_format          JSONB NOT NULL,
    scoring_config        JSONB NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Seed sport-specific rules (idempotent)
INSERT INTO sport_rules_table_tennis (sport_id, supports_singles, supports_doubles, supports_team_matches, uses_team_roster, has_captain, has_vice_captain, min_players_per_side, max_players_per_side, match_format, scoring_config)
SELECT id, true, true, false, false, false, false, 1, 2,
    '{"sets_to_win":3,"best_of_sets":5,"points_per_set":11,"win_by_margin":2,"deuce_enabled":true}'::jsonb,
    '{"points_to_win_set":11,"difference_to_win_set":2,"best_of_sets":5,"event_types":["point_won","ace","serve_error","receive_error","rally_won","error"]}'::jsonb
FROM sports WHERE code = 'TT'
ON CONFLICT (sport_id) DO UPDATE SET
    match_format = EXCLUDED.match_format,
    scoring_config = EXCLUDED.scoring_config,
    updated_at = now();

INSERT INTO sport_rules_badminton (sport_id, supports_singles, supports_doubles, supports_team_matches, uses_team_roster, has_captain, has_vice_captain, min_players_per_side, max_players_per_side, match_format, scoring_config)
SELECT id, true, true, false, false, false, false, 1, 2,
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":21,"win_by_margin":2,"deuce_enabled":true,"max_points_limit":30}'::jsonb,
    '{"points_to_win_set":21,"difference_to_win_set":2,"best_of_sets":3,"max_points_limit":30,"event_types":["point_won","smash","net_kill","service_fault","error"]}'::jsonb
FROM sports WHERE code = 'BAD'
ON CONFLICT (sport_id) DO UPDATE SET
    match_format = EXCLUDED.match_format,
    scoring_config = EXCLUDED.scoring_config,
    updated_at = now();

INSERT INTO sport_rules_volleyball (sport_id, supports_singles, supports_doubles, supports_team_matches, uses_team_roster, has_captain, has_vice_captain, min_roster_size, max_roster_size, min_players_per_side, max_players_per_side, match_format, scoring_config)
SELECT id, false, false, true, true, true, true, 6, 15, 6, 12,
    '{"sets_to_win":3,"best_of_sets":5,"points_per_set":25,"win_by_margin":2,"deuce_enabled":true,"deciding_set_points":15}'::jsonb,
    '{"points_to_win_set":25,"difference_to_win_set":2,"best_of_sets":5,"deciding_set_points":15,"event_types":["point_won","kill","block","ace","dig","error"]}'::jsonb
FROM sports WHERE code = 'VB'
ON CONFLICT (sport_id) DO UPDATE SET
    match_format = EXCLUDED.match_format,
    scoring_config = EXCLUDED.scoring_config,
    updated_at = now();

INSERT INTO sport_rules_pickleball (sport_id, supports_singles, supports_doubles, supports_team_matches, uses_team_roster, has_captain, has_vice_captain, min_players_per_side, max_players_per_side, match_format, scoring_config)
SELECT id, true, true, false, false, false, false, 1, 2,
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":11,"win_by_margin":2,"deuce_enabled":true}'::jsonb,
    '{"points_to_win_set":11,"difference_to_win_set":2,"best_of_sets":3,"event_types":["point_won","dink","kitchen_violation","error"]}'::jsonb
FROM sports WHERE code = 'PBL'
ON CONFLICT (sport_id) DO UPDATE SET
    match_format = EXCLUDED.match_format,
    scoring_config = EXCLUDED.scoring_config,
    updated_at = now();

INSERT INTO sport_rules_tennis (sport_id, supports_singles, supports_doubles, supports_team_matches, uses_team_roster, has_captain, has_vice_captain, min_players_per_side, max_players_per_side, match_format, scoring_config)
SELECT id, true, true, false, false, false, false, 1, 2,
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":6,"win_by_margin":2,"deuce_enabled":true,"tiebreak_at":6}'::jsonb,
    '{"games_to_win_set":6,"difference_to_win_set":2,"best_of_sets":3,"tiebreak_at":6,"event_types":["point_won","ace","double_fault","winner","unforced_error"]}'::jsonb
FROM sports WHERE code = 'TEN'
ON CONFLICT (sport_id) DO UPDATE SET
    match_format = EXCLUDED.match_format,
    scoring_config = EXCLUDED.scoring_config,
    updated_at = now();
