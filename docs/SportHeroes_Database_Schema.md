# SportHeroes — Database Schema (MVP)

**Stack context:** Flutter (client) + Node.js/Express (API) + PostgreSQL (recommended)
**Auth:** Firebase Authentication (backend only stores `firebase_uid` + profile data — no passwords)

---

## 0. Conventions

| Convention | Rule |
|---|---|
| Primary keys | `UUID DEFAULT gen_random_uuid()` on every table |
| Timestamps | Every table has `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()` |
| Soft delete | Use `is_active BOOLEAN DEFAULT true` instead of hard deletes where history matters (users, teams, tournaments) |
| Enums | Implemented as Postgres `CREATE TYPE ... AS ENUM`, listed per table |
| Money/points | Plain `INTEGER` — no fractional points in any of the 4 MVP sports |
| Extensibility rule | **Never hardcode a sport.** Every sport-specific behavior hangs off `sport_id`, not a table name or column. This is what lets you add Tennis/Squash/Chess later without a migration to core tables. |

---

## 1. Identity & Player Profile

### `users`
The single identity table. A "player", "organizer", and "team captain" are all just a `users` row playing different roles in context — there's no separate `players` table.

```sql
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE,
    phone_number        VARCHAR(20),
    full_name           VARCHAR(150) NOT NULL,
    display_name        VARCHAR(50),
    profile_picture_url TEXT,
    date_of_birth       DATE,
    gender              gender_type,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### `sports`
Master table. Seed with 4 rows for MVP (Table Tennis, Badminton, Volleyball, Pickleball); add rows later — no code deploy needed for new sport metadata.

```sql
CREATE TABLE sports (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(50) UNIQUE NOT NULL,       -- 'Table Tennis'
    code                  VARCHAR(10) UNIQUE NOT NULL,       -- 'TT', 'BAD', 'VB', 'PBL'
    icon_url              TEXT,
    description           TEXT,
    is_team_sport         BOOLEAN DEFAULT false,             -- supports doubles/team play
    default_match_format  JSONB NOT NULL,                    -- see note below
    is_active             BOOLEAN DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now()
);
```

`default_match_format` example (Table Tennis):
```json
{
  "sets_to_win": 3,
  "best_of_sets": 5,
  "points_per_set": 11,
  "win_by_margin": 2,
  "deuce_enabled": true
}
```
Badminton would differ (21 points, best of 3), Volleyball (25 points / 15 for deciding set), Pickleball (11 points, win by 2). This is exactly how you support 4+ sports without 4+ scoring tables.

### `player_sport_profiles`
A player's identity *within* a specific sport (their rating, ranking points, preferred sport flag). One user can play multiple sports.

```sql
CREATE TYPE skill_level_type AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');

CREATE TABLE player_sport_profiles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id          UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    skill_level       skill_level_type DEFAULT 'beginner',
    ranking_points    INTEGER DEFAULT 0,
    is_primary_sport  BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, sport_id)
);
```

---

## 2. Teams

### `teams`
```sql
CREATE TABLE teams (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id          UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    name              VARCHAR(100) NOT NULL,
    short_name        VARCHAR(10),
    logo_url          TEXT,
    description       TEXT,
    captain_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    vice_captain_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);
```

### `team_members`
Junction table between `teams` and `users`. Role is duplicated from `teams.captain_id`/`vice_captain_id` here so team roster queries don't need a join back to `teams`.

```sql
CREATE TYPE team_role_type AS ENUM ('captain', 'vice_captain', 'member');

CREATE TABLE team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        team_role_type DEFAULT 'member',
    joined_at   TIMESTAMPTZ DEFAULT now(),
    left_at     TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    UNIQUE (team_id, user_id)
);
```

---

## 3. Tournaments

### `tournaments`
```sql
CREATE TYPE tournament_format_type AS ENUM ('league', 'round_robin', 'knockout');
CREATE TYPE tournament_participant_kind AS ENUM ('individual', 'team');
CREATE TYPE tournament_status_type AS ENUM
    ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');

CREATE TABLE tournaments (
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
```

### `tournament_participants`
Either `user_id` or `team_id` is set, matching `tournaments.participant_kind`.

```sql
CREATE TYPE participant_status_type AS ENUM ('registered', 'confirmed', 'withdrawn', 'disqualified');

CREATE TABLE tournament_participants (
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
```

### `tournament_rounds`
Groups matches into stages (Round 1, Quarterfinal, Semifinal, Final) — needed for knockout fixture generation and display.

```sql
CREATE TABLE tournament_rounds (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number   INTEGER NOT NULL,
    round_name     VARCHAR(50) NOT NULL,   -- 'Quarterfinal', 'Round 1', etc.
    created_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tournament_id, round_number)
);
```

### `tournament_standings`
Populated/updated for `league`/`round_robin` formats after each match (points table). For `knockout`, this can be skipped or used only for a final placement summary.

```sql
CREATE TABLE tournament_standings (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id  UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id        UUID REFERENCES teams(id) ON DELETE CASCADE,
    matches_played INTEGER DEFAULT 0,
    wins           INTEGER DEFAULT 0,
    losses         INTEGER DEFAULT 0,
    points         INTEGER DEFAULT 0,     -- league points (e.g. 2 for win, 0 for loss)
    position       INTEGER,               -- current rank in the table
    updated_at     TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_standing_entity CHECK (
        (user_id IS NOT NULL AND team_id IS NULL) OR
        (user_id IS NULL AND team_id IS NOT NULL)
    ),
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, team_id)
);
```

---

## 4. Matches & Live Scoring

### `matches`
The parent record for any match — casual (`tournament_id IS NULL`) or tournament-linked.

```sql
CREATE TYPE match_type_kind AS ENUM ('singles', 'doubles', 'team');
CREATE TYPE match_status_type AS ENUM
    ('scheduled', 'ongoing', 'paused', 'completed', 'cancelled');
CREATE TYPE match_side_type AS ENUM ('A', 'B');

CREATE TABLE matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id            UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    tournament_id       UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    tournament_round_id UUID REFERENCES tournament_rounds(id) ON DELETE SET NULL,
    match_type          match_type_kind NOT NULL,
    match_format        JSONB NOT NULL,   -- snapshot copied from sports.default_match_format at creation time
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
```

> Why snapshot `match_format` onto the match instead of always reading `sports.default_match_format`? Because if you later edit a sport's default rules, in-progress and historical matches must keep the rules they were actually played under.

### `match_participants`
Either `user_id` (singles/doubles individual) or `team_id` (team matches) — same pattern as tournament participants. For doubles, two rows share `side = 'A'` and two share `side = 'B'`.

```sql
CREATE TABLE match_participants (
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
```

### `match_sets`
One row per set/game within a match.

```sql
CREATE TABLE match_sets (
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
```

### `match_points`
Point-by-point ledger. This is what makes **undo** and **match timeline** possible — `match_sets` only holds the current running total; this table holds every individual scoring event.

```sql
CREATE TABLE match_points (
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
```
> Undo = mark the latest non-undone row `is_undone = true` and recompute `match_sets` totals from remaining rows. Never hard-delete — keeps a full audit trail.

### `match_status_logs`
Audit trail of the match lifecycle (scheduled → started → paused → resumed → completed/cancelled).

```sql
CREATE TABLE match_status_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    previous_status   match_status_type,
    new_status        match_status_type NOT NULL,
    changed_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason            TEXT,
    changed_at        TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Statistics (Leaderboard Source)

### `player_statistics`
One row per (player, sport), recalculated after every completed match involving that player.

```sql
CREATE TABLE player_statistics (
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
```

### `team_statistics`
```sql
CREATE TABLE team_statistics (
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
```

**Leaderboards** = `SELECT ... FROM player_statistics ORDER BY current_ranking_points DESC / win_percentage DESC`, filtered by `sport_id` and optionally `city`/`country`. `tournament_standings` already gives you "tournament champions." No dedicated leaderboard table needed for MVP — add a materialized view later only if query performance demands it.

---

## 6. Recommended Indexes

```sql
CREATE INDEX idx_player_sport_profiles_user ON player_sport_profiles(user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_sets_match ON match_sets(match_id);
CREATE INDEX idx_match_points_match_set ON match_points(match_set_id);
CREATE INDEX idx_player_statistics_sport_rank ON player_statistics(sport_id, current_ranking_points DESC);
```

---

## 7. Table Summary & Relationships

| Table | Purpose | Key Foreign Keys |
|---|---|---|
| `users` | Identity (players, captains, organizers) | — |
| `sports` | Master sport list + rule config | — |
| `player_sport_profiles` | Player's rating/level per sport | `user_id`, `sport_id` |
| `teams` | Team info | `sport_id`, `captain_id`, `vice_captain_id`, `created_by` |
| `team_members` | Roster | `team_id`, `user_id` |
| `tournaments` | Tournament info | `sport_id`, `organizer_id` |
| `tournament_participants` | Who's registered | `tournament_id`, `user_id`/`team_id` |
| `tournament_rounds` | Bracket stages | `tournament_id` |
| `tournament_standings` | Points table | `tournament_id`, `user_id`/`team_id` |
| `matches` | Match record | `sport_id`, `tournament_id`, `tournament_round_id`, `created_by` |
| `match_participants` | Who's playing | `match_id`, `user_id`/`team_id` |
| `match_sets` | Per-set score | `match_id` |
| `match_points` | Point-by-point log (undo) | `match_id`, `match_set_id`, `recorded_by` |
| `match_status_logs` | Lifecycle audit | `match_id`, `changed_by` |
| `player_statistics` | Aggregated player stats | `user_id`, `sport_id` |
| `team_statistics` | Aggregated team stats | `team_id` |

---

## 8. Future-Proofing Notes

- **New sport?** Insert one row into `sports` with its own `default_match_format` JSON. Zero table changes.
- **New sport-specific stat** (e.g., chess doesn't have "sets")? Add a `custom_stats JSONB` column to `player_statistics` rather than new columns per sport.
- **Push notifications / device tokens**: add a `user_devices` table later (`user_id`, `fcm_token`, `platform`) — deliberately excluded from MVP per your scope.
- **Real-time sockets**: `match_points`/`match_sets` are already structured so a future WebSocket layer just emits on the same writes — no schema change needed when you add sockets later.
