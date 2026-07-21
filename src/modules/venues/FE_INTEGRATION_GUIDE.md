# Venues Module — Flutter Integration Guide

Base path: `/api/v1/venues`

List/get are **public**. Create / update / delete require **Bearer token**.

FE should send GPS coordinates from the device location when creating a venue.

---

## 1. Create Venue

**POST** `/api/v1/venues`  
**Auth:** Bearer required

### Request body

```json
{
  "name": "Mumbai Sports Complex",
  "latitude": 19.076,
  "longitude": 72.8777,
  "address": "Andheri East",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India"
}
```

| Field | Type | Required |
|-------|------|----------|
| `name` | string (2–150) | yes |
| `latitude` | number (-90…90) | yes |
| `longitude` | number (-180…180) | yes |
| `address` | string | no |
| `city` | string | no |
| `state` | string | no |
| `country` | string | no |

### Response `201`

```json
{
  "success": true,
  "message": "Venue created",
  "data": {
    "venue": {
      "id": "uuid",
      "name": "Mumbai Sports Complex",
      "latitude": 19.076,
      "longitude": 72.8777,
      "address": "Andheri East",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "createdBy": "uuid",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## 2. List Venues

**GET** `/api/v1/venues`

### Query params

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |
| `q` | string | optional search (name/address/city) |
| `activeOnly` | string | `true` |

### Response `200`

```json
{
  "success": true,
  "data": {
    "venues": [ { "...venue object..." } ],
    "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

---

## 3. Get Venue

**GET** `/api/v1/venues/:id`

### Response `200`

```json
{
  "success": true,
  "data": { "venue": { "...venue object..." } }
}
```

---

## 4. Update Venue

**PATCH** `/api/v1/venues/:id`  
**Auth:** Bearer required (creator only)

### Request body (at least one field)

```json
{
  "name": "Updated Name",
  "latitude": 19.08,
  "longitude": 72.88
}
```

### Response `200`

```json
{
  "success": true,
  "message": "Venue updated",
  "data": { "venue": { "...updated..." } }
}
```

---

## 5. Delete Venue (soft delete)

**DELETE** `/api/v1/venues/:id`  
**Auth:** Bearer required (creator only)

### Response `200`

```json
{
  "success": true,
  "message": "Venue deleted"
}
```

---

## Flutter flow

1. User picks location on map / device GPS → read `latitude` / `longitude`
2. Enter venue name → `POST /api/v1/venues`
3. Venue picker → `GET /api/v1/venues?q=...`
4. When creating a match, pass `venueId` from the selected venue
