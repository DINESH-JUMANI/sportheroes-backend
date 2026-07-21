# SportHeroes — Implementation Status & Future Roadmap

This document describes what is **currently implemented** in the SportHeroes backend (as of the MVP foundation build), what is **planned next**, and what **future features** can be added without rewriting the core platform.

**Stack:** Flutter (client) · Node.js / Express / TypeScript (API) · PostgreSQL · Prisma · Firebase Phone Auth

---

## 1. Design philosophy (why it looks this way)

SportHeroes follows one core rule from the database schema:

> **Never hardcode a sport.** Every sport-specific behavior hangs off `sport_id` and JSONB config — not separate table names per sport.

That means:

- There is **one** `sports` table (not `table_tennis_sports`, `badminton_sports`, etc.)
- There is **one** `matches` table with a `match_format` JSONB snapshot per match
- There is **one** `player_statistics` table keyed by `(user_id, sport_id)`

The [Full ERD](./SportHeroes_Full_ERD.mermaid) also shows **optional sport-specific stats tables** (`player_table_tennis`, `player_badminton`, etc.) and `sport_event_types`. Those are **future extensions** for deep analytics — they are intentionally **not** in the current MVP schema.

---

## 2. Currently implemented

### 2.1 Infrastructure & tooling

| Area | Status | Notes |
|------|--------|-------|
| Express + TypeScript modular monolith | ✅ | Modules: `auth`, `sports`, `teams`, `tournaments`, `matches`, `statistics` |
| PostgreSQL + Prisma ORM | ✅ | Full schema in `prisma/schema.prisma` |
| Numbered SQL migrations | ✅ | `1.add_user.sql` … `7.seed_dev_user.sql` |
| Central config (`config.ts`) | ✅ | Env-driven JWT, Firebase, logging, Swagger |
| Structured logger | ✅ | `error`, `warn`, `info`, `http`, `debug` levels |
| Request logging middleware | ✅ | All API calls logged with status + duration |
| Swagger / OpenAPI docs | ✅ | `http://localhost:3000/api/docs` — all modules documented |
| Dev test user + 1-year JWT | ✅ | `npm run db:seed:dev` or `POST /api/v1/auth/dev-login` |

### 2.2 Database tables (migrations applied)

| # | Migration | Tables |
|---|-----------|--------|
| 1 | `add_user` | `users` |
| 2 | `add_sports_and_player_profiles` | `sports` (+ 4 MVP sports seeded), `player_sport_profiles` |
| 3 | `add_teams` | `teams`, `team_members` |
| 4 | `add_tournaments` | `tournaments`, `tournament_participants`, `tournament_rounds`, `tournament_standings` |
| 5 | `add_matches` | `matches`, `match_participants`, `match_sets`, `match_points`, `match_status_logs` |
| 6 | `add_statistics` | `player_statistics`, `team_statistics` |
| 7 | `seed_dev_user` | Dev test user for API testing without Firebase |
| 10 | `team_roles_and_logo_blob` | `admin` value on `team_role_type` |
| 11 | `sport_specific_rules` | `sport_rules_*` tables + Tennis (5th sport) |
| 12 | `team_logo_blob` | `teams.logo_blob`, `teams.logo_mime_type` |

### 2.3 API modules

#### Auth (`/api/v1/auth`)

| Endpoint | Status |
|----------|--------|
| `POST /login` — Firebase phone token → app JWT (7 days) | ✅ |
| `POST /dev-login` — Dev-only 1-year JWT | ✅ |
| `GET /me` | ✅ |
| `PATCH /profile` | ✅ |
| `POST /logout` | ✅ |

Docs: `src/modules/auth/AUTH_FLOW.md`, `src/modules/auth/FE_INTEGRATION_GUIDE.md`

---

#### Sports & player profiles (`/api/v1/sports`, `/api/v1/player-profiles`)

| Capability | Status |
|------------|--------|
| List / get sports (by ID or code) | ✅ |
| 5 sports seeded (TT, BAD, VB, PBL, TEN) | ✅ |
| Per-sport rules API (`GET /sports/code/:code/rules`) | ✅ |
| Per-sport `default_match_format` JSONB | ✅ |
| Create / list / update / delete player sport profiles | ✅ |
| Skill level + primary sport flag | ✅ |

Docs: `src/modules/sports/FE_INTEGRATION_GUIDE.md`

---

#### Teams (`/api/v1/teams`)

| Capability | Status |
|------------|--------|
| Create team by `sportCode` (creator becomes **admin**) | ✅ |
| List / get teams (filter by `sportCode`) | ✅ |
| Update team details + logo blob (admin only) | ✅ |
| `GET/PUT /teams/:id/logo` — image stored as BYTEA in DB | ✅ |
| Soft-delete team (admin only) | ✅ |
| Add members by **phone number** (create placeholder user if needed) | ✅ |
| Lookup user by phone before add | ✅ |
| Update member roles (admin only) | ✅ |
| Remove members (admin or captain) | ✅ |
| Roles: **admin**, captain, vice_captain, member | ✅ |
| Team statistics row created on team creation | ✅ |

Docs: `src/modules/teams/FE_INTEGRATION_GUIDE.md`

---

#### Search (`/api/v1/search`)

| Capability | Status |
|------------|--------|
| Global case-insensitive search | ✅ |
| Types: users, teams, tournaments, matches, venues | ✅ |

Docs: `src/modules/search/FE_INTEGRATION_GUIDE.md`

---

#### Sport-specific rules (`/api/v1/sports/code/:code/rules`)

| Capability | Status |
|------------|--------|
| Separate rule tables per sport (TT, BAD, VB, PBL, TEN) | ✅ |
| Per-sport: singles/doubles/team support, captain flags, roster limits | ✅ |
| Per-sport match format + scoring config | ✅ |

---

#### Tournaments (`/api/v1/tournaments`)

| Capability | Status |
|------------|--------|
| Create / list / get / update tournaments | ✅ |
| Formats: league, round_robin, knockout | ✅ |
| Participant kind: individual or team | ✅ |
| Status workflow (draft → registration_open → … → completed) | ✅ |
| Register participants (user or team) | ✅ |
| Manage participant status + seeding | ✅ |
| Create / list rounds | ✅ |
| Tournament standings (auto-updated on match complete) | ✅ |

**Not yet implemented:** automatic fixture/bracket generation.

Docs: `src/modules/tournaments/FE_INTEGRATION_GUIDE.md`

---

#### Matches & live scoring (`/api/v1/matches`)

| Capability | Status |
|------------|--------|
| Create match (singles, doubles, team) | ✅ |
| Link to tournament / round (optional) | ✅ |
| Match format snapshotted from sport at creation | ✅ |
| Lifecycle: start, pause, resume, complete, cancel | ✅ |
| Point-by-point scoring (side A / B) | ✅ |
| Undo last point (audit trail preserved) | ✅ |
| Set win detection from `match_format` rules | ✅ |
| Auto-complete match when sets_to_win reached | ✅ |
| Match status audit log | ✅ |
| Point timeline API | ✅ |
| List matches with filters | ✅ |

**Scoring model:** REST polling (client refreshes every few seconds). No WebSockets yet.

Docs: `src/modules/matches/FE_INTEGRATION_GUIDE.md`

---

#### Statistics & leaderboards (`/api/v1/statistics`)

| Capability | Status |
|------------|--------|
| Player stats per sport (auto-recalc on match complete) | ✅ |
| Team stats (auto-recalc on match complete) | ✅ |
| Player leaderboard (by ranking points, win %, matches played) | ✅ |
| Team leaderboard | ✅ |
| Ranking points: +10 per win | ✅ |
| Tournament league points: +2 per win | ✅ |

Docs: `src/modules/statistics/FE_INTEGRATION_GUIDE.md`

---

### 2.4 What the MVP backend can do end-to-end today

A user (via Flutter or Swagger) can:

1. **Authenticate** with Firebase phone OTP → receive app JWT
2. **Complete profile** and add sport profiles
3. **Create a team** and manage roster
4. **Organize a tournament**, open registration, register players/teams
5. **Create a match**, start it, record points live, undo mistakes
6. **Complete a match** and see stats + leaderboard update automatically
7. **View match history**, point timeline, and tournament standings

---

## 3. Intentionally not implemented (MVP exclusions)

These were scoped out of the first release per [ProjectOverview.md](./ProjectOverview.md):

| Feature | Reason deferred |
|---------|-----------------|
| WebSockets / real-time push | REST polling is sufficient for MVP |
| Redis / caching | Not needed at current scale |
| Automatic tournament fixture generation | Manual match creation works first |
| Sport-specific event types (ace, smash, kill) | Generic point scoring only |
| Sport-specific stats tables | Universal `player_statistics` is enough for MVP |
| Push notifications | No `user_devices` table yet |
| Chat / social feed | Out of scope |
| Video uploads / live streaming | Out of scope |
| AI match insights | Out of scope |
| Elasticsearch / advanced search | Out of scope |
| Microservices | Modular monolith first |
| Web admin portal | Mobile-first MVP |
| Public player profiles | Auth required for most flows today |
| Club / academy management | Teams cover doubles/tournament needs for now |

---

## 4. Near-term future implementations (Phase 2)

These build directly on the current schema with **no breaking changes**:

### 4.1 Tournament automation

- **Fixture generator** for league / round-robin (all-vs-all schedule)
- **Knockout bracket generator** from seeded participants
- **Auto-assign matches** to `tournament_rounds`
- **Bye handling** for non-power-of-2 brackets

### 4.2 Richer scoring events

From the [Full ERD](./SportHeroes_Full_ERD.mermaid):

```
sports → sport_event_types → match_points.event_type_id
```

| Addition | Purpose |
|----------|---------|
| `sport_event_types` table | Per-sport event catalog (ace, smash, kill, fault, etc.) |
| `match_points.event_type_id` | Tag each point with event type |
| `match_points.metadata` JSONB | Extra context (e.g. serve number, rally length) |

Enables richer match timelines without changing core scoring flow.

### 4.3 Sport-specific statistics tables

Optional 1:1 extension tables per sport (from Full ERD):

| Table | Sport | Example stats |
|-------|-------|-----------------|
| `player_table_tennis` | Table Tennis | aces, serve errors, rally wins, win streaks |
| `player_badminton` | Badminton | smash winners, net kills, service faults |
| `player_volleyball` | Volleyball | kills, blocks, digs, attack efficiency |
| `player_pickleball` | Pickleball | dinks won, kitchen violations |
| `team_volleyball` | Volleyball | team kills, blocks, aces |

`player_statistics` remains the universal summary; sport tables hold deep metrics.

### 4.4 Player discovery & profiles

- Public read-only player profiles (no auth)
- Search players by name, city, sport
- Player match history API with pagination
- Head-to-head comparison between two players

### 4.5 Notifications

```
user_devices (user_id, fcm_token, platform)
```

- Match start / end notifications
- Tournament registration reminders
- Score update alerts for followed players

---

## 5. Medium-term future features (Phase 3)

### 5.1 Real-time layer

| Feature | Approach |
|---------|----------|
| Live score sync | WebSockets or SSE on `match_points` writes |
| Live spectators | Read-only socket subscription per match |
| Spectator count | Redis counter per match |

The current `match_points` / `match_sets` schema is already structured so a socket layer can emit on the same writes — **no schema change required**.

### 5.2 Advanced tournament features

- Multi-stage tournaments (group stage → knockout)
- Walkover / forfeit handling
- Referee / scorer role (separate from players)
- Tournament export (PDF brackets, CSV standings)
- Payment / entry fee tracking (optional)

### 5.3 Rankings & analytics

- Elo / Glicko-2 rating system (replace flat +10 points)
- City / state / country filtered leaderboards
- Season-based rankings (reset per year)
- Performance trends (form guide, last 10 matches)
- `custom_stats JSONB` on `player_statistics` for sport-specific metrics without new columns

### 5.4 Social & community

- Follow players / teams
- Activity feed (match results, tournament wins)
- Comments on matches (moderated)
- Share match result cards (deep links)

### 5.5 Club & academy management

- Clubs as organizations above teams
- Academy batch / coaching groups
- Coach role with player roster management
- Facility / venue booking

---

## 6. Long-term / platform features (Phase 4+)

| Feature | Description |
|---------|-------------|
| **New sports** | Insert one row into `sports` with JSONB rules — zero core table changes (Tennis, Squash, Chess, etc.) |
| **AI match insights** | Point-pattern analysis, weakness detection, suggested drills |
| **Video highlights** | Link video clips to `match_points` timestamps |
| **Live streaming integration** | Embed stream URL on match / tournament |
| **Web admin portal** | Tournament organizer dashboard, bulk operations |
| **Public API / widgets** | Embeddable live score widget for websites |
| **Multi-tenancy** | White-label for clubs / associations |
| **Elasticsearch** | Full-text search across players, teams, tournaments |
| **Microservices split** | Extract scoring engine, notifications, search when scale demands |
| **Offline-first mobile** | Queue score events locally, sync when online |
| **Referee certification** | Verified official accounts for sanctioned matches |
| **Anti-cheat / verification** | GPS check-in, photo verification at venues |

---

## 7. Schema evolution map

How the current MVP relates to the [Full ERD](./SportHeroes_Full_ERD.mermaid):

```
CURRENT (MVP)                          FUTURE (Full ERD extension)
─────────────────────────────────────  ─────────────────────────────────────
users                                  users (unchanged)
sports + default_match_format JSONB    sports + sport_event_types
player_sport_profiles                  player_sport_profiles (unchanged)
teams, team_members                    teams, team_members (unchanged)
tournaments + participants + rounds    + auto fixture generation
matches + participants + sets          matches (unchanged)
match_points (scoring_side only)       match_points + event_type_id + metadata
player_statistics (universal)          + player_table_tennis, player_badminton, …
team_statistics (universal)            + team_volleyball, …
                                       user_devices (push notifications)
```

**Adding a new sport today:** one `INSERT` into `sports` — no migration to core tables.

**Adding sport-specific stats later:** new extension table + migration — core tables untouched.

---

## 8. Flutter integration status

Each backend module has an FE integration guide:

| Module | Guide |
|--------|-------|
| Auth | `src/modules/auth/FE_INTEGRATION_GUIDE.md` |
| Sports | `src/modules/sports/FE_INTEGRATION_GUIDE.md` |
| Teams | `src/modules/teams/FE_INTEGRATION_GUIDE.md` |
| Search | `src/modules/search/FE_INTEGRATION_GUIDE.md` |
| Tournaments | `src/modules/tournaments/FE_INTEGRATION_GUIDE.md` |
| Matches | `src/modules/matches/FE_INTEGRATION_GUIDE.md` |
| Statistics | `src/modules/statistics/FE_INTEGRATION_GUIDE.md` |

Swagger: `http://localhost:3000/api/docs`

---

## 9. Recommended build order (suggested)

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | Flutter screens for auth + profile + sports picker | Unblocks all other flows |
| 2 | Match create + live scoring UI | Core product value |
| 3 | Player stats + leaderboard screens | Retention / engagement |
| 4 | Tournament create + registration | Community growth |
| 5 | Fixture generator (backend) | Reduces manual work for organizers |
| 6 | WebSockets for live scores | Better UX than polling |
| 7 | Sport event types + rich timeline | Deeper match detail |
| 8 | Push notifications | Re-engagement |
| 9 | Sport-specific stat tables | Power users / analytics |
| 10 | Public profiles + search | Discovery & growth |

---

## 10. Success criteria checklist

From [ProjectOverview.md](./ProjectOverview.md) — backend readiness:

| Criteria | Backend | Flutter |
|----------|---------|---------|
| Create an account | ✅ API ready | 🔲 |
| Manage profile | ✅ API ready | 🔲 |
| Create teams | ✅ API ready | 🔲 |
| Create tournaments | ✅ API ready | 🔲 |
| Record matches | ✅ API ready | 🔲 |
| Record scores | ✅ API ready | 🔲 |
| View statistics | ✅ API ready | 🔲 |
| View rankings | ✅ API ready | 🔲 |
| View match history | ✅ API ready | 🔲 |

The **backend MVP foundation is complete**. Remaining work is primarily Flutter UI, tournament automation, and the Phase 2+ features listed above.

---

## 11. Related documentation

| Document | Purpose |
|----------|---------|
| [ProjectOverview.md](./ProjectOverview.md) | Product vision, scope, principles |
| [SportHeroes_Database_Schema.md](./SportHeroes_Database_Schema.md) | MVP database design |
| [SportHeroes_Full_ERD.mermaid](./SportHeroes_Full_ERD.mermaid) | Extended ERD with future tables |
| [SportHeroes_Class_Diagram.mermaid](./SportHeroes_Class_Diagram.mermaid) | Domain model / class structure |
| [SportHeroes_ERD.mermaid](./SportHeroes_ERD.mermaid) | Core MVP ERD diagram |

---

*Last updated: reflects backend state after Auth, Sports, Teams, Tournaments, Matches, and Statistics modules were implemented.*
