# Table Tennis Scoring — Rules & Backend Design

Scope: **Table Tennis only**, built on the existing MVP schema (`matches`, `match_sets`, `match_points`, `match_format` JSONB). No new tables required — everything hangs off `sport_id = TT` and JSONB config, per the "never hardcode a sport" rule.

---

## 1. TT rules — the practical subset you need for scoring

### 1.1 Winning a point (rally)
A point is awarded to a player whenever the opponent fails to make a good return — this includes normal rally errors *and* service faults. For scoring purposes you only need two categories:

| Type | Effect |
|------|--------|
| **Normal point** | Rally lost/won in play → point to winner |
| **Service fault** | Illegal serve (bad toss, hidden ball, foot fault, wrong side, etc.) → point awarded **immediately** to the receiver. No replay. |
| **Let** | Serve clips the net but otherwise lands legally → **no point**, replay the same serve, same server |

So your point-recording flow only ever does one of two things: **award a point** or **replay without scoring** (let). A service fault is just "award a point to receiver," tagged differently for stats.

### 1.2 Winning a game
- Standard: first to **11 points**, win by **2 clear points**.
- If score reaches **10–10 (deuce)**, play continues with no cap until one side leads by 2 (12–10, 15–13, etc.).
- Older/legacy format: games to **21**, same win-by-2 rule, deuce at 20–20. Some leagues use this for historical/friendly matches.
- The "15" you mentioned isn't a standard ITTF number — some regional leagues use it as a house rule (typically fast/knockout formats). Treat it the same as 11/21: just a configurable `points_per_set` with the same deuce logic at `points_per_set - 1`.

**Rule of thumb:** deuce always kicks in at `points_per_set - 1` all, and the winning condition is always "reach ≥ points_per_set AND lead by ≥ win_by_margin."

### 1.3 Winning the match
Best-of an odd number of games (so there's always a winner):
- Common: **best of 5** (first to 3 games) or **best of 7** (first to 4).
- Fully configurable — this already matches your `sets_to_win` / `best_of_sets` fields.

### 1.4 Service rotation (the part people get wrong)
- Each player serves **2 consecutive points**, then service passes to the opponent — **regardless of who won those points**.
- **Exception at deuce:** once the score hits `points_per_set - 1` all (10–10 in an 11-point game), service switches **every single point** instead of every 2.
- **Between games:** the player who *received* first in the previous game **serves** first in the next game (service alternates game to game automatically).
- **Doubles** (future, not needed now): service rotates to a specific diagonal opponent and partners alternate receiving — flagged here as a known gap, not solved in this doc.

### 1.5 Ends / side switch (cosmetic, not scoring-critical)
- Players switch ends after each completed game.
- In the deciding (last possible) game, players switch ends when either side first reaches **half of `points_per_set`, rounded up** (e.g. 5 points in an 11-point game). This has no effect on score/service — only relevant if you ever show a "switch sides now" prompt.

---

## 2. Schema changes

### 2.1 `sports.default_match_format` (JSONB) — TT row

```json
{
  "points_per_set": 11,
  "sets_to_win": 3,
  "best_of_sets": 5,
  "win_by_margin": 2,
  "deuce_enabled": true,
  "serve_switch_interval": 2,
  "deuce_serve_switch_interval": 1
}
```

This is a superset of the `Tennis` example already in your Swagger docs — same shape, different sport, no schema change needed. To support a 21-point legacy variant or a 15-point house-rule variant, just create the match with an **overridden** `match_format` at creation time (matches already snapshot `match_format` per-match, per your docs) — no new table, no new column.

### 2.2 `match_points` — two small additions

| Column | Type | Notes |
|--------|------|-------|
| `point_type` | enum: `normal`, `service_fault`, `let` | Defaults `normal`. `let` rows don't change score but preserve full audit trail (matches your existing undo/audit philosophy). |
| `server_side` | enum: `A`, `B` | Who served *this specific point*. Store it rather than recomputing on read — keeps the point timeline self-explanatory and makes undo trivial (no need to re-derive server history). |

No changes needed to `match_sets` or `match_status_logs`.

---

## 3. Server-computation logic

Compute the current server whenever a point is about to be recorded (and return it in every match/point response so the client always knows who's serving next).

```ts
function currentServer(
  pointsA: number,
  pointsB: number,
  initialServer: 'A' | 'B',
  format: MatchFormat
): 'A' | 'B' {
  const { points_per_set, serve_switch_interval, deuce_serve_switch_interval } = format;
  const deuceThreshold = points_per_set - 1;
  const inDeuce = pointsA >= deuceThreshold && pointsB >= deuceThreshold;

  const total = pointsA + pointsB;
  const interval = inDeuce ? deuce_serve_switch_interval : serve_switch_interval;

  // How many full "service turns" have elapsed
  const turnsElapsed = Math.floor(total / interval);

  return turnsElapsed % 2 === 0 ? initialServer : otherSide(initialServer);
}
```

`initialServer` for game 1 comes from a coin toss recorded at match start (or a `firstServer` field you already might collect at match creation). For every subsequent game, `initialServer` = whoever **received** first in the previous game — i.e. flip it automatically:

```ts
nextGameInitialServer = otherSide(previousGameInitialServer);
```

This means you never need to ask the umpire "who serves this game?" — it falls out of game number + who served game 1.

---

## 4. API changes

### 4.1 Extend `POST /api/v1/matches/{id}/point`

```jsonc
{
  "scoringSide": "A",          // required, as today — receiver's side for a fault
  "pointType": "normal"        // optional, enum: normal | service_fault | let, default "normal"
}
```

Behavior:
- `normal` / `service_fault` → same code path as today: increment `scoringSide`'s point count, check set-win / match-win, recompute server, append `match_points` row with `point_type` + `server_side`.
- `let` → **no score change**. Append a `match_points` row with `point_type: "let"` and current `server_side` (for the record), but don't touch `match_sets` counters, don't advance the service-turn counter, don't run win-detection.

Response (add two fields to the existing `match` payload):

```jsonc
{
  "match": {
    // ...existing fields
    "currentServer": "B",
    "isDeuce": true
  }
}
```

### 4.2 `POST /api/v1/matches/{id}/undo-point`
Already exists and already "recalculates scores" per your docs — just extend the recalculation to also **replay server computation** from scratch (cheap, since it's a pure function of point counts) and to skip `let` rows when recalculating score (they never affected it) but still remove the most recent row of *any* type, since undo should mean "undo the last thing that happened," not "undo the last scoring event."

### 4.3 No new endpoints needed
Everything above rides on your existing `/point`, `/undo-point`, `/start`, `/complete` — this is intentionally a minimal, additive change so it doesn't touch matches, tournaments, or statistics modules at all.

---

## 5. Worked example (11-point game, singles)

| Rally # | Scoring side | Score after | Server (before this point) | Notes |
|---|---|---|---|---|
| 1 | A | 1–0 | A | A serves 1st pair |
| 2 | A | 2–0 | A | A serves 2nd of pair |
| 3 | B | 2–1 | B | service switched after 2 total points |
| ... | ... | ... | ... | switches every 2 total points |
| — | — | 10–10 | — | **deuce reached** → switch interval becomes 1 |
| 21 | A | 11–10 | B | |
| 22 | A | 12–10 | A | A wins game 12–10, service switch every point now |

Game 2 then starts with `initialServer = B` (B received first in game 1), and the whole cycle repeats with fresh `match_sets` row and reset point counts.

---

## 6. What this deliberately does NOT cover (by design, matches your MVP scope)

- Doubles service rotation (diagonal serving, partner alternation) — flag as future work alongside your existing `player_table_tennis` extension table plan.
- `sport_event_types` (tagging *why* a point was won — smash, net, edge, etc.) — you've already scoped this for Phase 2; `point_type` here is a minimal 3-value enum, not the full event catalog.
- Umpire warning-before-fault workflow — treated as out of scope for a scoring app; a fault is scored immediately.
