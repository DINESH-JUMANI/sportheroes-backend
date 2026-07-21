# Search Module — Flutter Integration Guide

Base path: `/api/v1/search`

**Public** — no auth required.

Case-insensitive search across users, teams, tournaments, matches, and venues.

---

## 1. Global Search

**GET** `/api/v1/search`

### Query params

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `q` | string | yes | Search term (name, phone, venue, etc.) |
| `types` | string | no | Comma-separated: `users`, `teams`, `tournaments`, `matches`, `venues`. Default: all |
| `page` | number | no | Default `1` |
| `limit` | number | no | Default `20` |

### Example

```
GET /api/v1/search?q=mumbai&types=users,teams,tournaments&page=1&limit=20
```

### Response `200`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "team",
        "id": "uuid",
        "title": "Mumbai Smashers",
        "subtitle": "Volleyball",
        "meta": {
          "sportCode": "VB",
          "shortName": "MSM"
        }
      },
      {
        "type": "user",
        "id": "uuid",
        "title": "Rahul Sharma",
        "subtitle": "+919999999999",
        "meta": {
          "displayName": "Rahul",
          "city": "Mumbai",
          "email": null
        }
      },
      {
        "type": "venue",
        "id": "tournament-venue:Mumbai Sports Complex",
        "title": "Mumbai Sports Complex",
        "subtitle": "Mumbai, Maharashtra",
        "meta": {
          "source": "tournament"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "query": "mumbai",
      "types": ["users", "teams", "tournaments"]
    }
  }
}
```

### Result types

| `type` | Searches on |
|--------|-------------|
| `user` | `fullName`, `displayName`, `phoneNumber`, `email`, `city` |
| `team` | `name`, `shortName`, `description` |
| `tournament` | `name`, `venue`, `city`, `description` |
| `match` | `venue` |
| `venue` | Distinct venues from tournaments and matches |

### Errors

| Status | When |
|--------|------|
| `400` | Missing or empty `q` |

---

## Flutter flow

1. Search bar on home → debounce input → `GET /api/v1/search?q={term}`
2. Filter chips → pass `types=users,teams` etc.
3. Tap result → navigate by `type` + `id` to the relevant screen

---

## Related modules

- Teams: `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Sports: `src/modules/sports/FE_INTEGRATION_GUIDE.md`
- Auth (users): `src/modules/auth/FE_INTEGRATION_GUIDE.md`
