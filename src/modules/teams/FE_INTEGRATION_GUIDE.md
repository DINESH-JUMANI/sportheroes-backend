# Teams Module — Flutter Integration Guide

Base path: `/api/v1/teams`

List/get endpoints are **public**. Create/update/delete and member management require **Bearer token**.

**Roles**

| Role | Permissions |
|------|-------------|
| `admin` | Update team details, upload logo, add/remove members, assign any role, delete team |
| `captain` | Add/remove members only (always as `member` role) |
| `vice_captain` | Tag only — same as member |
| `member` | View team |

Creator is automatically assigned `admin`.

Use `sportCode` (e.g. `TT`, `VB`) — not UUID — when creating teams. See sport rules: `GET /api/v1/sports/code/{code}/rules`.

**Legacy:** `sportId` on create and `userId` on add-member still work but prefer `sportCode` and `phoneNumber` for new UI flows.

---

## 1. Create Team

**POST** `/api/v1/teams`  
**Auth:** Bearer required

### Request body

```json
{
  "sportCode": "VB",
  "name": "Mumbai Smashers",
  "shortName": "MSM",
  "description": "Local volleyball team",
  "logoBase64": "<base64-string>",
  "logoMimeType": "image/png"
}
```

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `sportCode` | string | preferred | `TT`, `BAD`, `VB`, `PBL`, `TEN` |
| `sportId` | uuid | legacy | Alternative if UUID already cached from sports list |
| `name` | string | yes | 2–100 chars |
| `shortName` | string | no | max 10 chars |
| `description` | string | no | |
| `logoBase64` | string | no | Base64 image (with or without data-URI prefix) |
| `logoMimeType` | string | required if logo | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |

### Response `201`

```json
{
  "success": true,
  "message": "Team created",
  "data": {
    "team": {
      "id": "uuid",
      "sportId": "uuid",
      "name": "Mumbai Smashers",
      "shortName": "MSM",
      "logoUrl": null,
      "hasLogo": true,
      "logoMimeType": "image/png",
      "description": "Local volleyball team",
      "captainId": null,
      "viceCaptainId": null,
      "createdBy": "creator-user-uuid",
      "isActive": true,
      "sport": { "id": "uuid", "name": "Volleyball", "code": "VB" },
      "members": [
        {
          "id": "uuid",
          "userId": "uuid",
          "role": "admin",
          "joinedAt": "...",
          "leftAt": null,
          "isActive": true,
          "user": {
            "id": "uuid",
            "fullName": "Rahul Sharma",
            "displayName": "Rahul",
            "phoneNumber": "+919999999999",
            "profilePictureUrl": null
          }
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Validation error |
| `401` | Missing/invalid token |
| `404` | Unknown `sportCode` |

---

## 2. List Teams

**GET** `/api/v1/teams`

### Query params

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |
| `sportId` | uuid | optional |
| `sportCode` | string | optional (preferred for UI) |
| `activeOnly` | string | `true` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "teams": [ { "...team summary..." } ],
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

## 3. Get Team by ID

**GET** `/api/v1/teams/:id`

Includes full roster with member phone numbers.

### Response `200`

```json
{
  "success": true,
  "data": { "team": { "...full team with members..." } }
}
```

### Errors

| Status | When |
|--------|------|
| `404` | Team not found or inactive |

---

## 4. Update Team (admin only)

**PATCH** `/api/v1/teams/:id`  
**Auth:** Bearer required

### Request body (at least one field)

```json
{
  "name": "Updated Name",
  "shortName": "UN",
  "description": "New description",
  "logoBase64": "<base64>",
  "logoMimeType": "image/jpeg"
}
```

Pass `"logoBase64": null` to remove the logo.

### Response `200`

```json
{
  "success": true,
  "message": "Team updated",
  "data": { "team": { "...updated team..." } }
}
```

### Errors

| Status | When |
|--------|------|
| `403` | Caller is not admin |
| `404` | Team not found |

---

## 5. Upload Team Logo (admin only)

**PUT** `/api/v1/teams/:id/logo`  
**Auth:** Bearer required

### Request body

```json
{
  "logoBase64": "<base64-string>",
  "logoMimeType": "image/png"
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Team logo updated",
  "data": { "team": { "...team with hasLogo: true..." } }
}
```

---

## 6. Get Team Logo

**GET** `/api/v1/teams/:id/logo`

Returns raw image bytes. Use `hasLogo` on the team object to decide whether to fetch.

### Response `200`

Binary image with `Content-Type` header matching stored mime type.

### Errors

| Status | When |
|--------|------|
| `404` | Team not found or no logo stored |

---

## 7. Delete Team (admin only)

**DELETE** `/api/v1/teams/:id`  
**Auth:** Bearer required

Soft-deletes the team (`isActive: false`).

### Response `200`

```json
{
  "success": true,
  "message": "Team deleted"
}
```

---

## 8. Lookup User by Phone

**GET** `/api/v1/teams/lookup-user?phoneNumber=+919999999999`  
**Auth:** Bearer required

Use before adding a member to show whether the user exists.

### Response `200` — user found

```json
{
  "success": true,
  "data": {
    "found": true,
    "user": {
      "id": "uuid",
      "fullName": "Rahul Sharma",
      "displayName": "Rahul",
      "phoneNumber": "+919999999999",
      "profilePictureUrl": null
    }
  }
}
```

### Response `200` — user not found

```json
{
  "success": true,
  "data": { "found": false }
}
```

When `found` is false, collect `fullName` in the UI and pass it in the add-member request.

---

## 9. List Team Members

**GET** `/api/v1/teams/:id/members`

### Response `200`

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "userId": "uuid",
        "role": "member",
        "joinedAt": "...",
        "leftAt": null,
        "isActive": true,
        "user": {
          "id": "uuid",
          "fullName": "...",
          "displayName": "...",
          "phoneNumber": "+91...",
          "profilePictureUrl": null
        }
      }
    ]
  }
}
```

---

## 10. Add Team Member (by phone)

**POST** `/api/v1/teams/:id/members`  
**Auth:** Bearer required (admin or captain)

### Request body

```json
{
  "phoneNumber": "+919888877766",
  "fullName": "New Player",
  "role": "member"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `phoneNumber` | string | yes (preferred) | E.164 or digits |
| `userId` | uuid | legacy alternative | Skip lookup if you already have the user ID |
| `fullName` | string | required if user not in DB | Creates placeholder user |
| `role` | string | no | Default `member`. Admin can set `admin`, `captain`, `vice_captain` |

### Response `201`

```json
{
  "success": true,
  "message": "Member added",
  "data": { "member": { "...member object..." } }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | User not found and `fullName` missing; roster full; sport doesn't support role |
| `403` | Captain trying to assign non-member role |

---

## 11. Update Team Member Role (admin only)

**PATCH** `/api/v1/teams/:id/members/:memberId`  
**Auth:** Bearer required

Use `memberId` from the roster list when user taps a member in the UI.

### Request body

```json
{
  "role": "captain"
}
```

| `role` values | `admin`, `captain`, `vice_captain`, `member` |

### Response `200`

```json
{
  "success": true,
  "message": "Member updated",
  "data": { "member": { "...member object..." } }
}
```

### Errors

| Status | When |
|--------|------|
| `400` | Removing last admin; sport doesn't support role |
| `403` | Non-admin caller |

---

## 12. Remove Team Member

**DELETE** `/api/v1/teams/:id/members/:memberId`  
**Auth:** Bearer required (admin or captain)

Soft-removes member (`isActive: false`, sets `leftAt`).

### Response `200`

```json
{
  "success": true,
  "message": "Member removed"
}
```

---

## Flutter flow

1. Teams menu → `GET /api/v1/teams?sportCode=VB`
2. Open team → `GET /api/v1/teams/:id` (details + members)
3. Show logo → if `hasLogo`, `GET /api/v1/teams/:id/logo`
4. Add member → type phone → `GET /api/v1/teams/lookup-user?phoneNumber=...`
5. If found → `POST /api/v1/teams/:id/members` with phone only
6. If not found → collect name → `POST` with `phoneNumber` + `fullName`
7. Tap member → `PATCH /api/v1/teams/:id/members/:memberId` with new `role` (admin only)
8. Create team → `POST /api/v1/teams` with `sportCode` + optional logo base64

---

## Related modules

- Sport rules: `src/modules/sports/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
- Auth (placeholder user merge on login): `src/modules/auth/FE_INTEGRATION_GUIDE.md`
