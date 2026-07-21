# Tournaments Module — Flutter Integration Guide

Base path: `/api/v1/tournaments`

List/get endpoints are **public**. Create/update/register require **Bearer token**.

---

## 1. Create Tournament

**POST** `/api/v1/tournaments`  
**Auth:** Bearer required

### Request body

```json
{
  "sportId": "uuid",
  "name": "Mumbai Open Table Tennis 2026",
  "format": "knockout",
  "participantKind": "individual",
  "bannerUrl": "https://example.com/banner.jpg",
  "description": "Annual open tournament",
  "venue": "Sports Complex Hall A",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "registrationStartDate": "2026-07-01",
  "registrationEndDate": "2026-07-15",
  "startDate": "2026-07-20",
  "endDate": "2026-07-25",
  "maxParticipants": 32
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `format` | string | yes | `league`, `round_robin`, `knockout` |
| `participantKind` | string | yes | `individual`, `team` |
| `startDate` | string | yes | `YYYY-MM-DD` |
| Other date fields | string | no | `YYYY-MM-DD` |

### Response `201`

```json
{
  "success": true,
  "message": "Tournament created",
  "data": {
    "tournament": {
      "id": "uuid",
      "sportId": "uuid",
      "organizerId": "uuid",
      "name": "Mumbai Open Table Tennis 2026",
      "format": "knockout",
      "participantKind": "individual",
      "bannerUrl": null,
      "description": "...",
      "venue": "...",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "registrationStartDate": "2026-07-01",
      "registrationEndDate": "2026-07-15",
      "startDate": "2026-07-20",
      "endDate": "2026-07-25",
      "maxParticipants": 32,
      "status": "draft",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 2. List Tournaments

**GET** `/api/v1/tournaments`

### Query params

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default 1 |
| `limit` | number | Default 20 |
| `sportId` | uuid | Filter by sport |
| `status` | string | `draft`, `registration_open`, `registration_closed`, `ongoing`, `completed`, `cancelled` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "tournaments": [ { "...tournament object..." } ],
    "meta": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
  }
}
```

---

## 3. Get Tournament

**GET** `/api/v1/tournaments/:id`

### Response `200`

```json
{
  "success": true,
  "data": { "tournament": { "...tournament object..." } }
}
```

---

## 4. Update Tournament

**PATCH** `/api/v1/tournaments/:id`  
**Auth:** Bearer required (organizer only)

Same fields as create (all optional, at least one required).

### Response `200`

```json
{
  "success": true,
  "message": "Tournament updated",
  "data": { "tournament": { "...updated..." } }
}
```

---

## 5. Update Tournament Status

**PATCH** `/api/v1/tournaments/:id/status`  
**Auth:** Bearer required (organizer only)

### Request body

```json
{
  "status": "registration_open"
}
```

Typical flow: `draft` → `registration_open` → `registration_closed` → `ongoing` → `completed`

### Response `200`

```json
{
  "success": true,
  "message": "Status updated",
  "data": { "tournament": { "...status: registration_open..." } }
}
```

---

## 6. Register Participant

**POST** `/api/v1/tournaments/:id/participants`  
**Auth:** Bearer required

For individual tournaments send `userId`. For team tournaments send `teamId` (create teams via `src/modules/teams/FE_INTEGRATION_GUIDE.md` — use `sportCode` and phone-based members).

### Request body (individual)

```json
{
  "userId": "uuid",
  "seedNumber": 1
}
```

### Request body (team)

```json
{
  "teamId": "uuid",
  "seedNumber": 2
}
```

### Response `201`

```json
{
  "success": true,
  "message": "Registered",
  "data": {
    "participant": {
      "id": "uuid",
      "tournamentId": "uuid",
      "userId": "uuid",
      "teamId": null,
      "seedNumber": 1,
      "status": "registered",
      "registeredAt": "..."
    }
  }
}
```

---

## 7. List Participants

**GET** `/api/v1/tournaments/:id/participants`

### Response `200`

```json
{
  "success": true,
  "data": {
    "participants": [ { "...participant object..." } ]
  }
}
```

---

## 8. Update Participant

**PATCH** `/api/v1/tournaments/:id/participants/:participantId`  
**Auth:** Bearer required (organizer only)

### Request body

```json
{
  "status": "confirmed",
  "seedNumber": 3
}
```

| `status` values | `registered`, `confirmed`, `withdrawn`, `disqualified` |

### Response `200`

```json
{
  "success": true,
  "message": "Participant updated",
  "data": { "participant": { "...updated..." } }
}
```

---

## 9. Create Round

**POST** `/api/v1/tournaments/:id/rounds`  
**Auth:** Bearer required (organizer only)

### Request body

```json
{
  "roundNumber": 1,
  "roundName": "Quarterfinal"
}
```

### Response `201`

```json
{
  "success": true,
  "message": "Round created",
  "data": {
    "round": {
      "id": "uuid",
      "tournamentId": "uuid",
      "roundNumber": 1,
      "roundName": "Quarterfinal",
      "createdAt": "..."
    }
  }
}
```

---

## 10. List Rounds

**GET** `/api/v1/tournaments/:id/rounds`

### Response `200`

```json
{
  "success": true,
  "data": { "rounds": [ { "...round object..." } ] }
}
```

---

## 11. Get Standings

**GET** `/api/v1/tournaments/:id/standings`

League/round-robin points table. Updated automatically when tournament matches complete.

### Response `200`

```json
{
  "success": true,
  "data": {
    "standings": [
      {
        "id": "uuid",
        "tournamentId": "uuid",
        "userId": "uuid",
        "teamId": null,
        "matchesPlayed": 3,
        "wins": 2,
        "losses": 1,
        "points": 4,
        "position": 1,
        "updatedAt": "..."
      }
    ]
  }
}
```

---

## Related modules

- Teams (team tournaments): `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Matches (create tournament matches): `src/modules/matches/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
