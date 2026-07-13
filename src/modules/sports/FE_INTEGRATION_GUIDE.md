# Sports Module — Flutter Integration Guide

Base path: `/api/v1/sports`  
Player profiles: `/api/v1/player-profiles`

All list/get sport endpoints are **public**. Player profile endpoints require **Bearer token**.

---

## 1. List Sports

**GET** `/api/v1/sports`

Returns all active sports (Table Tennis, Badminton, Volleyball, Pickleball).

### Query params

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `activeOnly` | string | `true` | `true` or `false` |

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
        "createdAt": "2026-07-04T00:00:00.000Z",
        "updatedAt": "2026-07-04T00:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 4, "totalPages": 1 }
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
  "data": {
    "sport": { "...same fields as list item..." }
  }
}
```

---

## 3. Get Sport by Code

**GET** `/api/v1/sports/code/:code`

Example: `/api/v1/sports/code/TT`

### Response `200`

Same shape as get by ID.

---

## 4. Create Player Sport Profile

**POST** `/api/v1/player-profiles`  
**Auth:** Bearer required

Call after login when user selects which sports they play.

### Request body

```json
{
  "sportId": "uuid-of-sport",
  "skillLevel": "beginner",
  "isPrimarySport": true
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `sportId` | string (uuid) | yes | Sport ID from list sports |
| `skillLevel` | string | no | `beginner`, `intermediate`, `advanced`, `professional` |
| `isPrimarySport` | boolean | no | Default `false`. Only one primary sport per user |

### Response `201`

```json
{
  "success": true,
  "message": "Sport profile created",
  "data": {
    "profile": {
      "id": "uuid",
      "userId": "uuid",
      "sportId": "uuid",
      "skillLevel": "beginner",
      "rankingPoints": 0,
      "isPrimarySport": true,
      "sport": { "...sport object..." },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 5. Get My Sport Profiles

**GET** `/api/v1/player-profiles/me`  
**Auth:** Bearer required

### Response `200`

```json
{
  "success": true,
  "data": {
    "profiles": [ { "...profile object..." } ]
  }
}
```

---

## 6. Get User Sport Profiles (public)

**GET** `/api/v1/player-profiles/user/:userId`

### Response `200`

Same as my profiles.

---

## 7. Update Player Sport Profile

**PATCH** `/api/v1/player-profiles/:id`  
**Auth:** Bearer required

### Request body (at least one field)

```json
{
  "skillLevel": "intermediate",
  "isPrimarySport": false
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Sport profile updated",
  "data": { "profile": { "...profile object..." } }
}
```

---

## 8. Delete Player Sport Profile

**DELETE** `/api/v1/player-profiles/:id`  
**Auth:** Bearer required

### Response `200`

```json
{
  "success": true,
  "message": "Sport profile deleted"
}
```

---

## Flutter flow

1. After login → `GET /api/v1/sports` → show sport picker
2. User selects sports → `POST /api/v1/player-profiles` for each
3. Home screen → `GET /api/v1/player-profiles/me` to show user's sports
