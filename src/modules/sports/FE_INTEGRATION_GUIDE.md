# Sports Module — Flutter Integration Guide

Base path: `/api/v1/sports`

List/get are **public**. Create / update / delete require **Bearer token**.

Player sport profiles live in a separate module: see `src/modules/players/FE_INTEGRATION_GUIDE.md`.

Run seed if sports are missing: `npm run db:seed:sports`

---

## 1. List Sports

**GET** `/api/v1/sports`

### Query params

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |
| `activeOnly` | string | `true` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "sports": [
      {
        "id": "uuid",
        "name": "Table Tennis",
        "code": "TT",
        "iconUrl": null,
        "description": "Fast-paced racket sport played on a table",
        "isTeamSport": false,
        "defaultMatchFormat": {
          "sets_to_win": 3,
          "best_of_sets": 5,
          "points_per_set": 11,
          "win_by_margin": 2,
          "deuce_enabled": true
        },
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

## 2. Get Sport by ID

**GET** `/api/v1/sports/:id`

### Response `200`

```json
{
  "success": true,
  "data": { "sport": { "...same fields..." } }
}
```

---

## 3. Get Sport by Code

**GET** `/api/v1/sports/code/:code`

Example: `/api/v1/sports/code/TT`

---

## 4. Create Sport

**POST** `/api/v1/sports`  
**Auth:** Bearer required

Use this to add future sports (Tennis, Squash, etc.) without a code deploy.

### Request body

```json
{
  "name": "Tennis",
  "code": "TEN",
  "isTeamSport": false,
  "description": "Racket sport played on a court",
  "defaultMatchFormat": {
    "sets_to_win": 2,
    "best_of_sets": 3,
    "points_per_set": 6,
    "win_by_margin": 2,
    "deuce_enabled": true
  }
}
```

| Field | Required |
|-------|----------|
| `name` | yes |
| `code` | yes (unique, uppercased) |
| `defaultMatchFormat` | yes |
| `iconUrl`, `description`, `isTeamSport`, `isActive` | no |

### Response `201`

```json
{
  "success": true,
  "message": "Sport created",
  "data": { "sport": { "...sport object..." } }
}
```

---

## 5. Update Sport

**PATCH** `/api/v1/sports/:id`  
**Auth:** Bearer required

### Request body (at least one field)

```json
{
  "description": "Updated description",
  "defaultMatchFormat": {
    "sets_to_win": 2,
    "best_of_sets": 3,
    "points_per_set": 11,
    "win_by_margin": 2,
    "deuce_enabled": true
  },
  "isActive": true
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Sport updated",
  "data": { "sport": { "...updated..." } }
}
```

---

## 6. Delete Sport (soft delete)

**DELETE** `/api/v1/sports/:id`  
**Auth:** Bearer required

Sets `isActive: false` so historical matches/teams keep valid FKs.

### Response `200`

```json
{
  "success": true,
  "message": "Sport deactivated",
  "data": { "sport": { "...isActive: false..." } }
}
```

---

## Seeded MVP sports

| Name | Code | Team sport |
|------|------|------------|
| Table Tennis | TT | no |
| Badminton | BAD | no |
| Volleyball | VB | yes |
| Pickleball | PBL | no |
| Tennis | TEN | no |

```bash
npm run db:seed:sports
npm run db:migrate:11   # sport-specific rule tables (if not applied)
```

---

## 7. Get Sport-Specific Rules

**GET** `/api/v1/sports/code/:code/rules`

Returns per-sport configuration: supported match types, team roster rules, captain flags, roster limits, match format, and scoring config. Use this before creating teams or matches so the UI can show the right options per sport.

Example: `/api/v1/sports/code/VB/rules`

### Response `200`

```json
{
  "success": true,
  "data": {
    "rules": {
      "sportId": "uuid",
      "sportCode": "VB",
      "supportsSingles": false,
      "supportsDoubles": false,
      "supportsTeamMatches": true,
      "usesTeamRoster": true,
      "hasCaptain": true,
      "hasViceCaptain": true,
      "minRosterSize": 6,
      "maxRosterSize": 15,
      "minPlayersPerSide": 6,
      "maxPlayersPerSide": 12,
      "matchFormat": {
        "sets_to_win": 3,
        "best_of_sets": 5,
        "points_per_set": 25,
        "win_by_margin": 2,
        "deuce_enabled": true,
        "deciding_set_points": 15
      },
      "scoringConfig": {
        "points_to_win_set": 25,
        "difference_to_win_set": 2,
        "best_of_sets": 5,
        "deciding_set_points": 15,
        "event_types": ["point_won", "kill", "block", "ace", "dig", "error"]
      }
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `404` | Unknown sport code or rules not seeded |

---

## Related modules

- Player profiles: `src/modules/players/FE_INTEGRATION_GUIDE.md`
- Teams (use `sportCode` when creating): `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
