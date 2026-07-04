-- ============================================================================
-- SportHeroes — Operational Queries
-- Common reads/writes your API layer will run against the schema in 01_schema.sql
-- Replace :placeholders with real values (these are psql-style bind params).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. USER / PLAYER PROFILE
-- ----------------------------------------------------------------------------

-- Create a user on first Firebase login
INSERT INTO core.users (firebase_uid, email, full_name, display_name)
VALUES (:firebase_uid, :email, :full_name, :display_name)
RETURNING id;

-- Get full profile with all sport profiles
SELECT u.*, 
       json_agg(json_build_object(
           'sport', s.name, 'skill_level', psp.skill_level,
           'ranking_points', psp.ranking_points, 'is_primary', psp.is_primary_sport
       )) AS sport_profiles
FROM core.users u
LEFT JOIN core.player_sport_profiles psp ON psp.user_id = u.id
LEFT JOIN core.sports s ON s.id = psp.sport_id
WHERE u.id = :user_id
GROUP BY u.id;

-- Add a sport to a player's profile
INSERT INTO core.player_sport_profiles (user_id, sport_id, skill_level)
VALUES (:user_id, :sport_id, :skill_level)
ON CONFLICT (user_id, sport_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- B. STARTING A MATCH
-- ----------------------------------------------------------------------------

-- Create a casual (non-tournament) singles match, snapshotting the sport's
-- current default_match_format so future rule changes don't affect this match
INSERT INTO core.matches (sport_id, match_type, match_format, status, created_by)
SELECT id, 'singles', default_match_format, 'scheduled', :created_by
FROM core.sports WHERE code = :sport_code
RETURNING id;

-- Attach the two players to the match
INSERT INTO core.match_participants (match_id, side, user_id) VALUES
(:match_id, 'A', :player_a_id),
(:match_id, 'B', :player_b_id);

-- Start the match: flip status + open set 1
UPDATE core.matches SET status = 'ongoing', started_at = now() WHERE id = :match_id;

INSERT INTO core.match_sets (match_id, set_number, started_at)
VALUES (:match_id, 1, now())
RETURNING id;

-- Log the status transition (audit trail)
INSERT INTO core.match_status_logs (match_id, previous_status, new_status, changed_by)
VALUES (:match_id, 'scheduled', 'ongoing', :changed_by);

-- ----------------------------------------------------------------------------
-- C. LIVE SCORING — recording a point
-- ----------------------------------------------------------------------------

-- Look up the event_type_id once per sport at app startup / cache it client-side:
SELECT id, code, label, is_positive FROM core.sport_event_types
WHERE sport_id = (SELECT sport_id FROM core.matches WHERE id = :match_id);

-- Get the current running score for the active set (before recording the point)
SELECT side_a_score, side_b_score FROM core.match_sets WHERE id = :match_set_id;

-- Record a point (generic "point_won") or a tagged event (e.g. "ace")
INSERT INTO core.match_points
    (match_id, match_set_id, event_type_id, point_number, scoring_side,
     side_a_score_after, side_b_score_after, metadata, recorded_by)
VALUES
    (:match_id, :match_set_id, :event_type_id,
     (SELECT COALESCE(MAX(point_number), 0) + 1 FROM core.match_points WHERE match_set_id = :match_set_id AND is_undone = false),
     :scoring_side, :side_a_score_after, :side_b_score_after, :metadata_jsonb, :recorded_by);

-- Sync the running total onto match_sets (cheap, done on every point)
UPDATE core.match_sets
SET side_a_score = :side_a_score_after, side_b_score = :side_b_score_after, updated_at = now()
WHERE id = :match_set_id;

-- ----------------------------------------------------------------------------
-- D. UNDO — mark the latest point undone and recompute the set score
-- ----------------------------------------------------------------------------

-- Step 1: mark the most recent non-undone point as undone
UPDATE core.match_points
SET is_undone = true
WHERE id = (
    SELECT id FROM core.match_points
    WHERE match_set_id = :match_set_id AND is_undone = false
    ORDER BY point_number DESC LIMIT 1
)
RETURNING id;

-- Step 2: recompute match_sets from the remaining (non-undone) points
UPDATE core.match_sets ms
SET side_a_score = COALESCE((
        SELECT side_a_score_after FROM core.match_points
        WHERE match_set_id = ms.id AND is_undone = false
        ORDER BY point_number DESC LIMIT 1
    ), 0),
    side_b_score = COALESCE((
        SELECT side_b_score_after FROM core.match_points
        WHERE match_set_id = ms.id AND is_undone = false
        ORDER BY point_number DESC LIMIT 1
    ), 0),
    updated_at = now()
WHERE ms.id = :match_set_id;

-- ----------------------------------------------------------------------------
-- E. CLOSING A SET / FINISHING A MATCH
-- ----------------------------------------------------------------------------

-- Close the current set once the sport's win condition is met (app-layer decides
-- when; this just persists the result)
UPDATE core.match_sets
SET winner_side = :winner_side, ended_at = now()
WHERE id = :match_set_id;

-- Open the next set
INSERT INTO core.match_sets (match_id, set_number, started_at)
VALUES (:match_id, :next_set_number, now())
RETURNING id;

-- Finish the match
UPDATE core.matches
SET status = 'completed', winner_side = :winner_side, finished_at = now()
WHERE id = :match_id;

UPDATE core.match_participants
SET is_winner = true
WHERE match_id = :match_id AND side = :winner_side;

INSERT INTO core.match_status_logs (match_id, previous_status, new_status, changed_by)
VALUES (:match_id, 'ongoing', 'completed', :changed_by);

-- ----------------------------------------------------------------------------
-- F. STATS ROLLUP — run after a match completes (Phase 3 background worker)
-- ----------------------------------------------------------------------------

-- F1. Universal player_statistics upsert (per player in the match)
INSERT INTO core.player_statistics
    (user_id, sport_id, matches_played, matches_won, matches_lost,
     sets_won, sets_lost, total_points_scored, total_points_conceded)
SELECT
    mp.user_id,
    m.sport_id,
    1,
    CASE WHEN mp.is_winner THEN 1 ELSE 0 END,
    CASE WHEN mp.is_winner THEN 0 ELSE 1 END,
    (SELECT count(*) FROM core.match_sets ms WHERE ms.match_id = m.id AND ms.winner_side = mp.side),
    (SELECT count(*) FROM core.match_sets ms WHERE ms.match_id = m.id AND ms.winner_side IS NOT NULL AND ms.winner_side != mp.side),
    (SELECT COALESCE(SUM(CASE WHEN mp.side = 'A' THEN ms.side_a_score ELSE ms.side_b_score END), 0) FROM core.match_sets ms WHERE ms.match_id = m.id),
    (SELECT COALESCE(SUM(CASE WHEN mp.side = 'A' THEN ms.side_b_score ELSE ms.side_a_score END), 0) FROM core.match_sets ms WHERE ms.match_id = m.id)
FROM core.match_participants mp
JOIN core.matches m ON m.id = mp.match_id
WHERE m.id = :match_id AND mp.user_id IS NOT NULL
ON CONFLICT (user_id, sport_id) DO UPDATE SET
    matches_played = core.player_statistics.matches_played + 1,
    matches_won    = core.player_statistics.matches_won + EXCLUDED.matches_won,
    matches_lost   = core.player_statistics.matches_lost + EXCLUDED.matches_lost,
    sets_won       = core.player_statistics.sets_won + EXCLUDED.sets_won,
    sets_lost      = core.player_statistics.sets_lost + EXCLUDED.sets_lost,
    total_points_scored   = core.player_statistics.total_points_scored + EXCLUDED.total_points_scored,
    total_points_conceded = core.player_statistics.total_points_conceded + EXCLUDED.total_points_conceded,
    win_percentage = ROUND(
        (core.player_statistics.matches_won + EXCLUDED.matches_won)::numeric
        / NULLIF(core.player_statistics.matches_played + 1, 0) * 100, 2),
    updated_at = now();

-- F2. Sport-specific rollup example — Table Tennis aces, from the typed event stream
INSERT INTO sport_stats.player_table_tennis (user_id, total_aces, total_serve_errors, total_receive_errors, total_rallies_won)
SELECT
    mp_part.user_id,
    count(*) FILTER (WHERE et.code = 'ace'),
    count(*) FILTER (WHERE et.code = 'serve_error'),
    count(*) FILTER (WHERE et.code = 'receive_error'),
    count(*) FILTER (WHERE et.code = 'rally_won')
FROM core.match_points mpt
JOIN core.sport_event_types et ON et.id = mpt.event_type_id
JOIN core.match_participants mp_part ON mp_part.match_id = mpt.match_id AND mp_part.side = mpt.scoring_side
WHERE mpt.match_id = :match_id AND mpt.is_undone = false AND mp_part.user_id IS NOT NULL
GROUP BY mp_part.user_id
ON CONFLICT (user_id) DO UPDATE SET
    total_aces           = sport_stats.player_table_tennis.total_aces + EXCLUDED.total_aces,
    total_serve_errors   = sport_stats.player_table_tennis.total_serve_errors + EXCLUDED.total_serve_errors,
    total_receive_errors = sport_stats.player_table_tennis.total_receive_errors + EXCLUDED.total_receive_errors,
    total_rallies_won    = sport_stats.player_table_tennis.total_rallies_won + EXCLUDED.total_rallies_won,
    updated_at = now();

-- (Repeat the same pattern for player_badminton / player_volleyball / player_pickleball,
--  swapping the event codes for that sport's sport_event_types rows.)

-- ----------------------------------------------------------------------------
-- G. LEADERBOARDS
-- ----------------------------------------------------------------------------

-- Universal leaderboard — top players by ranking points, filterable by sport/city
SELECT u.full_name, u.city, ps.matches_played, ps.win_percentage, ps.current_ranking_points
FROM core.player_statistics ps
JOIN core.users u ON u.id = ps.user_id
JOIN core.sports s ON s.id = ps.sport_id
WHERE s.code = :sport_code
  AND (:city IS NULL OR u.city = :city)
ORDER BY ps.current_ranking_points DESC
LIMIT 50;

-- Sport-specific leaderboard — Table Tennis, ranked by aces
SELECT u.full_name, tt.total_aces, tt.total_rallies_won, ps.win_percentage
FROM sport_stats.player_table_tennis tt
JOIN core.users u ON u.id = tt.user_id
JOIN core.player_statistics ps
     ON ps.user_id = tt.user_id
     AND ps.sport_id = (SELECT id FROM core.sports WHERE code = 'TT')
ORDER BY tt.total_aces DESC
LIMIT 50;

-- Sport-specific leaderboard — Volleyball, ranked by attack efficiency
SELECT u.full_name, v.total_kills, v.total_blocks, v.attack_efficiency
FROM sport_stats.player_volleyball v
JOIN core.users u ON u.id = v.user_id
ORDER BY v.attack_efficiency DESC
LIMIT 50;

-- Team leaderboard
SELECT t.name, ts.matches_played, ts.win_percentage
FROM core.team_statistics ts
JOIN core.teams t ON t.id = ts.team_id
WHERE t.sport_id = (SELECT id FROM core.sports WHERE code = :sport_code)
ORDER BY ts.win_percentage DESC
LIMIT 50;

-- ----------------------------------------------------------------------------
-- H. MATCH HISTORY & TIMELINE
-- ----------------------------------------------------------------------------

-- A player's completed match history for a sport
SELECT m.id, m.finished_at, m.winner_side,
       (mp.side = m.winner_side) AS did_win,
       opp.full_name AS opponent_name
FROM core.matches m
JOIN core.match_participants mp ON mp.match_id = m.id AND mp.user_id = :user_id
JOIN core.match_participants opp_mp ON opp_mp.match_id = m.id AND opp_mp.side != mp.side
JOIN core.users opp ON opp.id = opp_mp.user_id
WHERE m.sport_id = :sport_id AND m.status = 'completed'
ORDER BY m.finished_at DESC
LIMIT 20 OFFSET :offset;

-- Full point-by-point timeline for a match (for replay/review UI)
SELECT mpt.point_number, mpt.scoring_side, et.label AS event_label,
       mpt.side_a_score_after, mpt.side_b_score_after, mpt.recorded_at
FROM core.match_points mpt
LEFT JOIN core.sport_event_types et ON et.id = mpt.event_type_id
WHERE mpt.match_id = :match_id AND mpt.is_undone = false
ORDER BY mpt.point_number;
