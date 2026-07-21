# Matches Module — Flutter Integration Guide

Base path: `/api/v1/matches`

List/get/timeline are **public** (for spectators). Create/score actions require **Bearer token**.

Poll `GET /api/v1/matches/:id` every few seconds during live matches (MVP has no WebSockets).

---

## Match lifecycle

```
scheduled → start → ongoing ⇄ paused → completed
                  ↘ cancelled
```

Points are recorded on `ongoing` matches. Match auto-completes when a side wins enough sets per `matchFormat`.

---

## 1. Create Match

**POST** `/api/v1/matches`  
**Auth:** Bearer required

### Request body (singles example)

```json
{
  "sportId": "uuid",
  "matchType": "singles",
  "venue": "Club Court 1",
  "scheduledAt": "2026-07-20T10:00:00.000Z",
  "tournamentId": null,
  "tournamentRoundId": null,
  "participants": [
    { "side": "A", "userId": "player-a-uuid" },
    { "side": "B", "userId": "player-b-uuid" }
  ]
}
```

### Request body (doubles example)

```json
{
  "sportId": "uuid",
  "matchType": "doubles",
  "participants": [
    { "side": "A", "userId": "player-1-uuid" },
    { "side": "A", "userId": "player-2-uuid" },
    { "side": "B", "userId": "player-3-uuid" },
    { "side": "B", "userId": "player-4-uuid" }
  ]
}
```

### Request body (team match)

```json
{
  "sportId": "uuid",
  "matchType": "team",
  "participants": [
    { "side": "A", "teamId": "team-a-uuid" },
    { "side": "B", "teamId": "team-b-uuid" }
  ]
}
```

| Field | Type | Required |
|-------|------|----------|
| `sportId` | uuid | yes |
| `matchType` | string | yes — `singles`, `doubles`, `team` |
| `participants` | array | yes — min 2, must include side A and B |
| `scheduledAt` | ISO datetime | no |
| `tournamentId` | uuid | no |
| `tournamentRoundId` | uuid | no |

`matchFormat` is copied from the sport's `defaultMatchFormat` automatically.

**Before creating a match**, call `GET /api/v1/sports/code/:code/rules` to determine which `matchType` values are valid for that sport (e.g. volleyball supports `team` only; table tennis supports `singles` and `doubles`).

### Response `201`

```json
{
  "success": true,
  "message": "Match created",
  "data": {
    "match": {
      "id": "uuid",
      "sportId": "uuid",
      "tournamentId": null,
      "tournamentRoundId": null,
      "matchType": "singles",
      "matchFormat": {
        "sets_to_win": 3,
        "best_of_sets": 5,
        "points_per_set": 11,
        "win_by_margin": 2,
        "deuce_enabled": true
      },
      "venue": "Club Court 1",
      "scheduledAt": "2026-07-20T10:00:00.000Z",
      "startedAt": null,
      "finishedAt": null,
      "status": "scheduled",
      "winnerSide": null,
      "createdBy": "uuid",
      "participants": [
        {
          "id": "uuid",
          "side": "A",
          "userId": "uuid",
          "teamId": null,
          "isWinner": false,
          "user": { "id": "uuid", "fullName": "Player A", "displayName": "A" }
        },
        {
          "id": "uuid",
          "side": "B",
          "userId": "uuid",
          "teamId": null,
          "isWinner": false,
          "user": { "id": "uuid", "fullName": "Player B", "displayName": "B" }
        }
      ],
      "sets": [
        {
          "id": "uuid",
          "setNumber": 1,
          "sideAScore": 0,
          "sideBScore": 0,
          "winnerSide": null,
          "startedAt": null,
          "endedAt": null
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 2. List Matches

**GET** `/api/v1/matches`

### Query params

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default 1 |
| `limit` | number | Default 20 |
| `sportId` | uuid | Filter |
| `tournamentId` | uuid | Filter |
| `status` | string | `scheduled`, `ongoing`, `paused`, `completed`, `cancelled` |
| `createdBy` | uuid | Filter by creator |

### Response `200`

```json
{
  "success": true,
  "data": {
    "matches": [ { "...match object..." } ],
    "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
  }
}
```

---

## 3. Get Match

**GET** `/api/v1/matches/:id`

Use this for live score polling.

### Response `200`

```json
{
  "success": true,
  "data": { "match": { "...full match with participants and sets..." } }
}
```

---

## 4. Get Match Timeline

**GET** `/api/v1/matches/:id/timeline`

Point-by-point history for match detail / undo audit.

### Response `200`

```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": "uuid",
        "pointNumber": 1,
        "scoringSide": "A",
        "sideAScoreAfter": 1,
        "sideBScoreAfter": 0,
        "isUndone": false,
        "recordedBy": "uuid",
        "recordedAt": "..."
      }
    ]
  }
}
```

---

## 5. Start Match

**POST** `/api/v1/matches/:id/start`  
**Auth:** Bearer required

Transitions: `scheduled` → `ongoing`

### Response `200`

```json
{
  "success": true,
  "message": "Match started",
  "data": { "match": { "...status: ongoing, startedAt set..." } }
}
```

---

## 6. Pause Match

**POST** `/api/v1/matches/:id/pause`  
**Auth:** Bearer required

Transitions: `ongoing` → `paused`

### Response `200`

```json
{
  "success": true,
  "message": "Match paused",
  "data": { "match": { "...status: paused..." } }
}
```

---

## 7. Resume Match

**POST** `/api/v1/matches/:id/resume`  
**Auth:** Bearer required

Transitions: `paused` → `ongoing`

### Response `200`

```json
{
  "success": true,
  "message": "Match resumed",
  "data": { "match": { "...status: ongoing..." } }
}
```

---

## 8. Record Point

**POST** `/api/v1/matches/:id/point`  
**Auth:** Bearer required

Only works when status is `ongoing`. Auto-completes match when a side wins enough sets.

### Request body

```json
{
  "scoringSide": "A"
}
```

| `scoringSide` | `A` or `B` |

### Response `200`

```json
{
  "success": true,
  "message": "Point recorded",
  "data": {
    "match": {
      "...updated scores in sets array...",
      "status": "ongoing",
      "winnerSide": null
    }
  }
}
```

When match is won automatically:

```json
{
  "success": true,
  "message": "Point recorded",
  "data": {
    "match": {
      "status": "completed",
      "winnerSide": "A",
      "finishedAt": "...",
      "participants": [
        { "side": "A", "isWinner": true, "..." : "..." },
        { "side": "B", "isWinner": false, "..." : "..." }
      ]
    }
  }
}
```

---

## 9. Undo Last Point

**POST** `/api/v1/matches/:id/undo-point`  
**Auth:** Bearer required

Reverts the most recent non-undone point and recalculates set scores.

### Response `200`

```json
{
  "success": true,
  "message": "Point undone",
  "data": { "match": { "...recalculated scores..." } }
}
```

---

## 10. Complete Match (manual)

**POST** `/api/v1/matches/:id/complete`  
**Auth:** Bearer required

Force-complete from `ongoing` or `paused`. Normally scoring auto-completes.

### Response `200`

```json
{
  "success": true,
  "message": "Match completed",
  "data": { "match": { "...status: completed..." } }
}
```

---

## 11. Cancel Match

**POST** `/api/v1/matches/:id/cancel`  
**Auth:** Bearer required

### Request body

```json
{
  "reason": "Player no-show"
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Match cancelled",
  "data": { "match": { "...status: cancelled..." } }
}
```

---

## Flutter live scoring flow

1. Create match → `POST /api/v1/matches`
2. Start → `POST /api/v1/matches/:id/start`
3. User taps +1 for side A → `POST /api/v1/matches/:id/point` `{ "scoringSide": "A" }`
4. Poll `GET /api/v1/matches/:id` every 3-5 seconds for spectators
5. Wrong score → `POST /api/v1/matches/:id/undo-point`
6. On `status: completed` → navigate to match summary, stats update automatically

---

## Related modules

- Sport rules (valid match types per sport): `src/modules/sports/FE_INTEGRATION_GUIDE.md`
- Teams (for `matchType: team`): `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
