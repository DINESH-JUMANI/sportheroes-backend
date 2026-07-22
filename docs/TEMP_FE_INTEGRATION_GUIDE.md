# SportHeroes — Temporary FE Handoff Guide

> **Delete after Flutter integrates.** Swagger: `http://localhost:3000/api/docs`

---

## What changed in this round

**User search typeahead** for match (and team) participant pickers — so the user can find someone by typing part of a **name**, **phone**, or **email** instead of entering the full phone number every time.

---

## New API — Search users

**GET** `/api/v1/search/users`

| | |
|--|--|
| Auth | `Authorization: Bearer <app JWT>` **required** |
| Purpose | Typeahead while creating a match / adding a participant |

### Query params

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `q` | yes | — | Search text (min 1 char). Matches **fullName**, **displayName**, **phoneNumber**, **email** (case-insensitive, partial). Digit fragments also match phone (e.g. `9999` → `+919999…`). |
| `page` | no | `1` | Pagination |
| `limit` | no | `15` | Max `50` |

### Examples

```
GET /api/v1/search/users?q=rahul
GET /api/v1/search/users?q=9999
GET /api/v1/search/users?q=jane@
GET /api/v1/search/users?q=%2B919&limit=10
```

### Success response `200`

```json
{
  "success": true,
  "message": "Users found",
  "data": {
    "users": [
      {
        "id": "uuid",
        "fullName": "Rahul Sharma",
        "displayName": "Rahul",
        "phoneNumber": "+919999999999",
        "email": "rahul@example.com",
        "profilePictureUrl": "https://…/avatar.jpg",
        "city": "Mumbai"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 15,
      "total": 1,
      "totalPages": 1,
      "query": "rahul"
    }
  }
}
```

Empty list when nothing matches: `data.users: []` (still `200`).

### Errors

| Status | When |
|--------|------|
| `400` | Missing / empty `q` |
| `401` | No / invalid JWT |

---

## Suggested FE flow (create match)

1. User focuses participant field → as they type, **debounce ~300ms** → call `GET /search/users?q=…`.
2. Show dropdown from `data.users` (name + phone + avatar).
3. **If user selects a row** → use that `phoneNumber` (and optionally `fullName`) in `POST /matches` participant payload (same as today).
4. **If no results / new person** → keep current UX: enter full phone (+ name if new) and create match; backend still creates a placeholder user when needed.

Match create participant shape is unchanged:

```json
{
  "side": "A",
  "phoneNumber": "+919999999999",
  "fullName": "Rahul Sharma"
}
```

`fullName` is only needed when the phone is **new** (placeholder user). If they picked an existing user from search, you can still send `fullName` or omit it — existing users are resolved by phone.

---

## Related (unchanged)

- Global search (home bar): `GET /api/v1/search?q=…&types=users,teams,…` (public, generic result cards).
- Prefer **`/search/users`** for match/team participant pickers — richer user fields + auth.
