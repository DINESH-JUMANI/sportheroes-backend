# Players Module — Flutter Integration Guide

Base path: `/api/v1/player-profiles`

All endpoints require **Bearer token**.

Sports master data is separate: see `src/modules/sports/FE_INTEGRATION_GUIDE.md`.

---

## 1. Create Player Sport Profile

**POST** `/api/v1/player-profiles`

Call after login when the user selects which sports they play.

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
| `sportId` | uuid | yes | From `GET /api/v1/sports` |
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

## 2. Get My Sport Profiles

**GET** `/api/v1/player-profiles/me`

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

## 3. Get User Sport Profiles

**GET** `/api/v1/player-profiles/user/:userId`

### Response `200`

Same shape as my profiles.

---

## 4. Update Player Sport Profile

**PATCH** `/api/v1/player-profiles/:id`

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

## 5. Delete Player Sport Profile

**DELETE** `/api/v1/player-profiles/:id`

### Response `200`

```json
{
  "success": true,
  "message": "Sport profile deleted"
}
```

---

## Flutter flow

1. `GET /api/v1/sports` → sport picker
2. User selects sports → `POST /api/v1/player-profiles` for each
3. Home → `GET /api/v1/player-profiles/me`

---

## Related modules

- Sports list & rules: `src/modules/sports/FE_INTEGRATION_GUIDE.md`
- Global search (find players by name/phone): `src/modules/search/FE_INTEGRATION_GUIDE.md`
