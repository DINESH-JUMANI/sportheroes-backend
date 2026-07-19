-- Migration 9: Ensure MVP sports exist (safe to re-run on any environment)
-- Production-safe: real sport names/codes only — no test/dev markers in data.
-- Run: npm run db:seed:sports

INSERT INTO sports (name, code, is_team_sport, description, default_match_format, is_active)
VALUES
(
    'Table Tennis',
    'TT',
    false,
    'Fast-paced racket sport played on a table',
    '{"sets_to_win":3,"best_of_sets":5,"points_per_set":11,"win_by_margin":2,"deuce_enabled":true,"serve_switch_interval":2,"deuce_serve_switch_interval":1,"sport_code":"TT"}'::jsonb,
    true
),
(
    'Badminton',
    'BAD',
    false,
    'Racket sport played with a shuttlecock',
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":21,"win_by_margin":2,"deuce_enabled":true,"sport_code":"BAD"}'::jsonb,
    true
),
(
    'Volleyball',
    'VB',
    true,
    'Team sport played over a net',
    '{"sets_to_win":3,"best_of_sets":5,"points_per_set":25,"win_by_margin":2,"deuce_enabled":true,"deciding_set_points":15}'::jsonb,
    true
),
(
    'Pickleball',
    'PBL',
    false,
    'Paddle sport combining elements of tennis, badminton and table tennis',
    '{"sets_to_win":2,"best_of_sets":3,"points_per_set":11,"win_by_margin":2,"deuce_enabled":true}'::jsonb,
    true
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    is_team_sport = EXCLUDED.is_team_sport,
    description = EXCLUDED.description,
    default_match_format = EXCLUDED.default_match_format,
    is_active = true,
    updated_at = now();
