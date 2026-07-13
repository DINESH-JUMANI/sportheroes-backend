# Teams Module — Flutter Integration Guide

Base path: `/api/v1/teams`

List/get endpoints are **public**. Create/update/delete require **Bearer token**.

---

## 1. Create Team

**POST** `/api/v1/teams`  
**Auth:** Bearer required

Creator becomes captain automatically.

### Request body

```json
{
  "sportId": "uuid",
  "name": "Mumbai Smashers",
  "shortName": "MSM",
  "logoUrl": "https://example.com/logo.png",
  "description": "Local doubles team"
}
```

| Field | Type | Required |
|-------|------|----------|
| `sportId` | uuid | yes |
| `name` | string (2-100) | yes |
| `shortName` | string (max 10) | no |
| `logoUrl` | url | no |
| `description` | string | no |

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
      "description": null,
      "captainId": "creator-user-uuid",
      "viceCaptainId": null,
      "createdBy": "creator-user-uuid",
      "isActive": true,
      "sport": { "id": "uuid", "name": "Table Tennis", "code": "TT" },
      "members": [
        {
          "id": "uuid",
          "userId": "uuid",
          "role": "captain",
          "joinedAt": "...",
          "leftAt": null,
          "isActive": true,
          "user": {
            "id": "uuid",
            "fullName": "Rahul Sharma",
            "displayName": "Rahul",
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

---

## 2. List Teams

**GET** `/api/v1/teams`

### Query params

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |
| `sportId` | uuid | optional filter |
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

Includes full roster with member details.

### Response `200`

```json
{
  "success": true,
  "data": { "team": { "...full team with members..." } }
}
```

---

## 4. Update Team

**PATCH** `/api/v1/teams/:id`  
**Auth:** Bearer required (captain/vice-captain/creator only)

### Request body (at least one field)

```json
{
  "name": "Updated Name",
  "shortName": "UN",
  "logoUrl": "https://...",
  "description": "New description",
  "captainId": "user-uuid",
  "viceCaptainId": "user-uuid"
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Team updated",
  "data": { "team": { "...updated team..." } }
}
```

---

## 5. Delete Team (soft delete)

**DELETE** `/api/v1/teams/:id`  
**Auth:** Bearer required (creator only)

### Response `200`

```json
{
  "success": true,
  "message": "Team deleted"
}
```

---

## 6. List Team Members

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
        "user": { "id": "uuid", "fullName": "...", "displayName": "...", "profilePictureUrl": null }
      }
    ]
  }
}
```

---

## 7. Add Team Member

**POST** `/api/v1/teams/:id/members`  
**Auth:** Bearer required (captain/vice-captain)

### Request body

```json
{
  "userId": "uuid",
  "role": "member"
}
```

| `role` values | `captain`, `vice_captain`, `member` |

### Response `201`

```json
{
  "success": true,
  "message": "Member added",
  "data": { "member": { "...member object..." } }
}
```

---

## 8. Update Team Member

**PATCH** `/api/v1/teams/:id/members/:memberId`  
**Auth:** Bearer required

### Request body

```json
{
  "role": "vice_captain",
  "isActive": true
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Member updated",
  "data": { "member": { "...member object..." } }
}
```

---

## 9. Remove Team Member

**DELETE** `/api/v1/teams/:id/members/:memberId`  
**Auth:** Bearer required

Soft-removes member (`isActive: false`, sets `leftAt`).

### Response `200`

```json
{
  "success": true,
  "message": "Member removed"
}
```
