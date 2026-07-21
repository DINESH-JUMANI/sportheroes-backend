# Statistics Module — Flutter Integration Guide

Base path: `/api/v1/statistics`

All endpoints are **public** (no auth required). Statistics are recalculated automatically when a match completes via scoring.

---

## 1. Player Leaderboard

**GET** `/api/v1/statistics/players/leaderboard`

Ranked list of players for a sport.

### Query params

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `sportId` | uuid | **yes** | — |
| `page` | number | no | 1 |
| `limit` | number | no | 20 |
| `sortBy` | string | no | `ranking_points` |

| `sortBy` values | `ranking_points`, `win_percentage`, `matches_played` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": "uuid",
        "userId": "uuid",
        "sportId": "uuid",
        "matchesPlayed": 15,
        "matchesWon": 10,
        "matchesLost": 5,
        "setsWon": 28,
        "setsLost": 18,
        "totalPointsScored": 245,
        "totalPointsConceded": 198,
        "winPercentage": 66.67,
        "currentRankingPoints": 100,
        "updatedAt": "...",
        "player": {
          "id": "uuid",
          "fullName": "Rahul Sharma",
          "displayName": "Rahul",
          "profilePictureUrl": null,
          "city": "Mumbai",
          "country": "India"
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
  }
}
```

---

## 2. Player Statistics

**GET** `/api/v1/statistics/players/:userId`

Stats for one player. Returns array (one entry per sport played).

### Query params

| Param | Type | Description |
|-------|------|-------------|
| `sportId` | uuid | Optional — filter to one sport |

### Response `200`

```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "id": "uuid",
        "userId": "uuid",
        "sportId": "uuid",
        "matchesPlayed": 15,
        "matchesWon": 10,
        "matchesLost": 5,
        "setsWon": 28,
        "setsLost": 18,
        "totalPointsScored": 245,
        "totalPointsConceded": 198,
        "winPercentage": 66.67,
        "currentRankingPoints": 100,
        "updatedAt": "..."
      }
    ]
  }
}
```

---

## 3. Team Leaderboard

**GET** `/api/v1/statistics/teams/leaderboard`

### Query params

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `sportId` | uuid | no | all sports |
| `page` | number | no | 1 |
| `limit` | number | no | 20 |
| `sortBy` | string | no | `win_percentage` |

| `sortBy` values | `win_percentage`, `matches_played` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": "uuid",
        "teamId": "uuid",
        "matchesPlayed": 8,
        "matchesWon": 6,
        "matchesLost": 2,
        "setsWon": 14,
        "setsLost": 6,
        "winPercentage": 75.0,
        "updatedAt": "...",
        "team": {
          "id": "uuid",
          "name": "Mumbai Smashers",
          "shortName": "MSM",
          "logoUrl": null,
          "hasLogo": true,
          "logoMimeType": "image/png",
          "sportId": "uuid"
        }
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 25, "totalPages": 2 }
  }
}
```

---

## 4. Team Statistics

**GET** `/api/v1/statistics/teams/:teamId`

### Response `200`

```json
{
  "success": true,
  "data": {
    "stats": {
      "id": "uuid",
      "teamId": "uuid",
      "matchesPlayed": 8,
      "matchesWon": 6,
      "matchesLost": 2,
      "setsWon": 14,
      "setsLost": 6,
      "winPercentage": 75.0,
      "updatedAt": "..."
    }
  }
}
```

If team has no completed matches yet:

```json
{
  "success": true,
  "data": {
    "stats": {
      "teamId": "uuid",
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "winPercentage": 0
    }
  }
}
```

---

## Ranking points

- +10 ranking points per match win (updates `player_statistics` and `player_sport_profiles.rankingPoints`)
- Tournament standings: +2 league points per win (for league/round-robin tournaments)

---

## Flutter screens

| Screen | API |
|--------|-----|
| Leaderboard tab | `GET /statistics/players/leaderboard?sportId=...` |
| Player profile stats | `GET /statistics/players/:userId?sportId=...` |
| Team profile stats | `GET /statistics/teams/:teamId` |
| Team rankings | `GET /statistics/teams/leaderboard?sportId=...` |

Team logos: if `hasLogo` is true, fetch image from `GET /api/v1/teams/:teamId/logo`.

---

## Related modules

- Teams: `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
