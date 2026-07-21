# Auth Module — Flutter Integration Guide

Base path: `/api/v1/auth`

See also: [AUTH_FLOW.md](./AUTH_FLOW.md) for Firebase setup and the full phone OTP flow.

---

## 1. Login / Register

**POST** `/api/v1/auth/login`  
**Auth:** None (public)

Send Firebase ID token after phone OTP verification on the client.

### Request body

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

### Response `200` (existing user)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "user": {
      "id": "uuid",
      "firebaseUid": "...",
      "email": null,
      "phoneNumber": "+919999999999",
      "fullName": "Rahul Sharma",
      "displayName": "Rahul",
      "profilePictureUrl": null,
      "dateOfBirth": null,
      "gender": null,
      "city": "Mumbai",
      "state": null,
      "country": "India",
      "isActive": true,
      "isProfileComplete": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "tokenType": "Bearer",
      "expiresIn": "7d",
      "expiresAt": "2026-07-11T00:00:00.000Z"
    }
  }
}
```

### Response `201` (new user)

Same shape with `"isNewUser": true` and `"message": "Account created successfully"`.

### Placeholder users (added to a team by phone)

If someone was added to a team via phone number before they signed up (`POST /api/v1/teams/:id/members`), their account exists as a placeholder. When they later complete Firebase phone OTP and call `POST /api/v1/auth/login`, the backend **merges** that placeholder into their real Firebase account — same `user.id`, team memberships preserved.

---

## 2. Get Current User

**GET** `/api/v1/auth/me`  
**Auth:** Bearer required

### Response `200`

```json
{
  "success": true,
  "data": {
    "user": { "...same user object as login..." }
  }
}
```

---

## 3. Update Profile

**PATCH** `/api/v1/auth/profile`  
**Auth:** Bearer required

Call when `isProfileComplete` is `false` after first login.

### Request body (at least one field)

```json
{
  "fullName": "Rahul Sharma",
  "displayName": "Rahul",
  "email": "rahul@example.com",
  "profilePictureUrl": "https://...",
  "dateOfBirth": "1998-05-12",
  "gender": "male",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India"
}
```

| `gender` values | `male`, `female`, `other`, `prefer_not_to_say` |

### Response `200`

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "user": { "...updated user..." } }
}
```

---

## 4. Logout

**POST** `/api/v1/auth/logout`  
**Auth:** Bearer required

Stateless JWT — delete token from secure storage on the client.

### Response `200`

```json
{
  "success": true,
  "message": "Logged out successfully. Discard the access token on the client."
}
```

---

## Headers for protected routes

```
Authorization: Bearer <accessToken from login>
Content-Type: application/json
```

Token expires after `AUTH_TOKEN_EXPIRY_DAYS` (default 7). Re-login via Firebase OTP when expired.

---

## Related modules

- Teams (add members by phone): `src/modules/teams/FE_INTEGRATION_GUIDE.md`
- Global search: `src/modules/search/FE_INTEGRATION_GUIDE.md`
