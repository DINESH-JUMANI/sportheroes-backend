# SportHeroes — Temporary FE Handoff Guide

> **Delete after Flutter integrates.** Swagger: `http://localhost:3000/api/docs`

---

## What changed in this round

1. **Unified API response** — every API returns the same envelope so FE can use one success/error modal.
2. **Help & Support module** — concerns dropdown CRUD + support tickets (ticket number, status, optional images).

---

## 1. Unified response shape (all APIs)

Use **`message`** for toasts/modals. Use **`success`** to pick success vs error UI.

### Success

```json
{
  "success": true,
  "message": "Match created",
  "data": { }
}
```

| Field | Type | Notes |
|-------|------|--------|
| `success` | `true` | Always |
| `message` | string | Show in FE modal / snackbar |
| `data` | object \| null | Payload (`null` on some deletes) |

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "path": "bestOfSets", "message": "Required" }]
  }
}
```

| Field | Type | Notes |
|-------|------|--------|
| `success` | `false` | Always |
| `message` | string | **Show this in the error modal** |
| `data` | `null` | Always null on errors |
| `error.code` | string | Optional programmatic handling |
| `error.details` | array? | Validation field errors |

**FE tip:** one modal → `response.message` + color from `response.success`.

**Exceptions (not JSON envelope):**
- `GET /teams/:id/logo` — raw image bytes
- `GET /support/tickets/:id/images/:imageId` — raw image bytes
- `/health` — health payload

---

## 2. Help & Support — overview

Base path: **`/api/v1/support`**

| Entity | Purpose |
|--------|---------|
| **Concerns** | Predefined dropdown options (+ **Other**) |
| **Tickets** | User submission → gets `ticketNumber` + `status` |

### Seeded concerns (after migration 15)

| Code | Label | `isOther` |
|------|-------|-----------|
| `account` | Account / Login | false |
| `match_scoring` | Match Scoring | false |
| `teams` | Teams | false |
| `tournaments` | Tournaments | false |
| `venues` | Venues | false |
| `bug_report` | Bug Report | false |
| `feature_request` | Feature Request | false |
| `other` | Other | **true** |

Run: `npm run db:migrate:15`

---

## 3. Concerns APIs (dropdown CRUD)

### List (public — for FE dropdown)

**GET** `/api/v1/support/concerns?activeOnly=true`

```json
{
  "success": true,
  "message": "Concerns fetched",
  "data": {
    "concerns": [
      {
        "id": "...",
        "code": "match_scoring",
        "label": "Match Scoring",
        "description": "...",
        "sortOrder": 20,
        "isOther": false,
        "isActive": true
      }
    ],
    "meta": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
  }
}
```

### Get one

**GET** `/api/v1/support/concerns/:id`

### Create (auth)

**POST** `/api/v1/support/concerns`

```json
{
  "code": "payments",
  "label": "Payments",
  "description": "Billing related",
  "sortOrder": 55,
  "isOther": false
}
```

### Update (auth)

**PATCH** `/api/v1/support/concerns/:id`

```json
{ "label": "Payments & Refunds", "isActive": true }
```

### Delete / deactivate (auth)

**DELETE** `/api/v1/support/concerns/:id` → soft-deletes (`isActive: false`)

---

## 4. Support tickets APIs

### Create ticket (auth)

**POST** `/api/v1/support/tickets`

```json
{
  "concernId": "<uuid from concerns list>",
  "description": "Describe the issue in at least 10 characters…",
  "otherConcernText": "Only if concern.isOther === true",
  "images": [
    {
      "imageBase64": "<base64 or data:image/png;base64,...>",
      "mimeType": "image/png"
    }
  ]
}
```

Rules:
- `images` optional, max **5**, each max **~5MB**, mime: jpeg/png/webp/gif
- If selected concern has `isOther: true` → **`otherConcernText` required**
- Response includes **`ticket.ticketNumber`** (e.g. `SH-000001`) and **`status: "open"`** — show the ticket number to the user

```json
{
  "success": true,
  "message": "Support ticket created",
  "data": {
    "ticket": {
      "id": "...",
      "ticketNumber": "SH-000001",
      "status": "open",
      "concern": { "label": "Bug Report", "isOther": false },
      "images": [{ "id": "...", "mimeType": "image/png", "sortOrder": 0 }],
      "description": "..."
    }
  }
}
```

### List my tickets (auth)

**GET** `/api/v1/support/tickets?mineOnly=true&status=open`

### Get by id (auth)

**GET** `/api/v1/support/tickets/:id`

### Get by ticket number (auth)

**GET** `/api/v1/support/tickets/by-number/SH-000001`

### Update status (auth)

**PATCH** `/api/v1/support/tickets/:id/status`

```json
{ "status": "resolved", "note": "Fixed on our side" }
```

Statuses: `open` | `in_progress` | `resolved` | `closed`

### Download image (auth, raw binary)

**GET** `/api/v1/support/tickets/:id/images/:imageId`

---

## 5. FE flow (suggested)

1. Open Help → `GET /support/concerns` → fill dropdown with `label` (keep `id`, check `isOther`).
2. User picks concern + description + optional photos.
3. If `isOther` → show free-text field → send as `otherConcernText`.
4. `POST /support/tickets` → show modal with `message` + display **`ticketNumber`**.
5. My tickets screen → `GET /support/tickets` → show status badges.
6. All API modals: read top-level **`message`** + **`success`**.
