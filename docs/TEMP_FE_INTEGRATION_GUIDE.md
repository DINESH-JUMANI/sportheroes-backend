# SportHeroes — Temporary FE Handoff Guide

> **Delete after Flutter integrates.** Swagger: `http://localhost:3000/api/docs`

---

## What changed in this round

1. **Supabase Auth / phone OTP removed** — auth is **email or phone + password** only  
2. **Supabase is Storage-only** (avatars, team logos, support images)  
3. **Placeholder users** (added via teams/matches) use **`POST /auth/set-password`** then get a JWT  

---

## Remove from FE

- Firebase (already gone)  
- Supabase Auth / OTP / `signInWithOtp` / sending Supabase `accessToken` to `/auth/login`  
- Keep Supabase **only if** you upload files client-side; otherwise just use our multipart upload APIs  

---

## Auth APIs

All success/error responses still use `{ success, message, data }`.

### Register

**POST** `/api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "phoneNumber": "+919000000001",
  "password": "Secret123!",
  "fullName": "Jane Doe"
}
```

Need **at least one** of `email` / `phoneNumber`. Returns `data.tokens.accessToken` (app JWT).

### Login (email **or** phone)

**POST** `/api/v1/auth/login`

```json
{ "email": "user@example.com", "password": "Secret123!" }
```

or

```json
{ "phoneNumber": "+919000000001", "password": "Secret123!" }
```

### Placeholder users (no password yet)

If login returns:

```json
{
  "success": false,
  "message": "Password is not set for this account. Use POST /auth/set-password to create one.",
  "error": { "code": "PASSWORD_NOT_SET" }
}
```

Then call:

**POST** `/api/v1/auth/set-password`

```json
{
  "phoneNumber": "+919000000001",
  "password": "Secret123!",
  "fullName": "Optional name update"
}
```

→ returns JWT. User can login normally after that.

### Reset password (knows current password — no OTP)

**POST** `/api/v1/auth/reset-password`

```json
{
  "email": "user@example.com",
  "currentPassword": "OldSecret1!",
  "newPassword": "NewSecret1!"
}
```

### Change password (logged in)

**POST** `/api/v1/auth/change-password`  
`Authorization: Bearer <app JWT>`

```json
{ "currentPassword": "OldSecret1!", "newPassword": "NewSecret1!" }
```

### FE login screen flow

1. User enters email **or** phone + password → `POST /login`  
2. If `PASSWORD_NOT_SET` → show “Create password” → `POST /set-password`  
3. If user not found → register screen → `POST /register`  
4. Store **`data.tokens.accessToken`** for all other APIs  

`user.hasPassword` on `/auth/me` is `false` until password is set.

---

## Images (unchanged — Supabase Storage via our API)

| Action | Endpoint | Body |
|--------|----------|------|
| Avatar | `POST /auth/avatar` | multipart `file` |
| Team logo | `PUT /teams/:id/logo` | multipart `file` |
| Support image | `POST /support/upload-image` | multipart `file` → `{ url }` |

---

## Match scorer (still applies)

Only `match.startedBy` can score/pause/resume/finish. Drop FE-local scorer storage.

---

## Backend setup you need

```bash
npm run db:migrate:17
npx prisma generate
```

`.env` — Storage only (no phone auth product needed):

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # storage uploads
```

Buckets still: `avatars`, `team-logos`, `support-tickets` (public read).

Dev: `POST /auth/dev-login` (sets password `DevPass123!` on seed user if missing).
