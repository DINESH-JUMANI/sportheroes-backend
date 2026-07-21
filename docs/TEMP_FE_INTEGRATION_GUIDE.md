# SportHeroes — Temporary FE Handoff Guide

> **Delete after Flutter integrates.** Swagger: `http://localhost:3000/api/docs`

---

## What changed in this round

**New users are auto-linked to all active sports** — no need to call “add sport profile” for each sport on signup.

---

## Auto sport profiles

When a user is created or logs in, the backend ensures they have a `player_sport_profile` for **every active sport**.

| Trigger | Behavior |
|---------|----------|
| `POST /auth/login` (new or existing) | Creates any missing sport profiles |
| `POST /auth/dev-login` | Same |
| Placeholder user created by phone (teams/matches) | Profiles created immediately |

### Defaults for auto-created profiles

| Field | Value |
|-------|--------|
| `skillLevel` | `beginner` |
| `rankingPoints` | `0` |
| `isPrimarySport` | `true` only on the first sport if the user has no primary yet |

### FE impact

- After login, `GET /api/v1/player-profiles/me` should already list **all sports**.
- Users can still update skill / primary via existing profile APIs.
- Creating a profile for a sport they already have still returns conflict (expected).
- If a **new sport** is added to the catalog later, the next login fills that profile in automatically.

No new endpoints. No request body changes.
