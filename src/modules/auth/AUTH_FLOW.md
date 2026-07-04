# SportHeroes — Phone Auth Flow (Firebase + Backend)

This document explains how phone-number login works end to end: Firebase setup, what `idToken` is, and how the Flutter app calls our login API.

---

## The mental model (read this first)

The user **never types an `idToken`**. They only enter their **phone number** and an **OTP**.

Firebase handles OTP on the mobile app. After OTP succeeds, Firebase gives the app a short-lived **ID token**. The Flutter app sends that token to our backend. Our backend verifies it with Firebase Admin, creates/finds the user in PostgreSQL, and returns our own **app JWT** (valid 7 days).

```
User                    Flutter (FE)                 Firebase                 SportHeroes API
 │                           │                           │                          │
 │  enters phone number      │                           │                          │
 │──────────────────────────►│                           │                          │
 │                           │  send OTP                 │                          │
 │                           │──────────────────────────►│                          │
 │                           │                           │                          │
 │  enters OTP code          │                           │                          │
 │──────────────────────────►│                           │                          │
 │                           │  verify OTP               │                          │
 │                           │──────────────────────────►│                          │
 │                           │◄──────────────────────────│                          │
 │                           │  Firebase user session    │                          │
 │                           │  + idToken                │                          │
 │                           │                           │                          │
 │                           │  POST /api/v1/auth/login  │                          │
 │                           │  { "idToken": "..." }     │                          │
 │                           │─────────────────────────────────────────────────────►│
 │                           │                           │   verifyIdToken(idToken) │
 │                           │                           │◄─────────────────────────│
 │                           │                           │─────────────────────────►│
 │                           │                           │   uid, phone_number      │
 │                           │◄─────────────────────────────────────────────────────│
 │                           │  app JWT (7 days) + user  │                          │
 │                           │                           │                          │
 │                           │  later APIs use:          │                          │
 │                           │  Authorization: Bearer <app JWT>                     │
```

**Summary**

| Who | Responsibility |
|-----|----------------|
| **User** | Enters phone number + OTP only |
| **Firebase (on Flutter)** | Sends OTP, verifies OTP, issues `idToken` |
| **Flutter** | Gets `idToken` from Firebase SDK, sends it to our API, stores our app JWT |
| **SportHeroes API** | Verifies `idToken`, upserts `users` row, returns app JWT |

Our API does **not** send SMS. Firebase does.

---

## Part 1 — Configure Firebase (Console)

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (or use an existing one)
3. Name it (e.g. `sportheroes`) and finish the wizard

### 2. Enable Phone Authentication

1. Open the project → **Build** → **Authentication**
2. Click **Get started** (if first time)
3. Open the **Sign-in method** tab
4. Enable **Phone**
5. Save

### 3. Register the Flutter Android app (and/or iOS)

**Android**

1. Project settings (gear) → **Your apps** → Add Android app
2. Enter package name (must match Flutter `applicationId`)
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`
5. Follow Firebase’s Gradle setup steps for FlutterFire

**iOS**

1. Add iOS app with your bundle ID
2. Download `GoogleService-Info.plist`
3. Add it to the iOS Runner in Xcode

### 4. Create a Service Account for the backend

The backend needs Admin credentials to **verify** ID tokens. It does not use the Flutter config files.

1. Project settings → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file (keep it secret — never commit it)

From that JSON, copy into backend `.env`:

| JSON field | `.env` variable |
|------------|-----------------|
| `project_id` | `FIREBASE_PROJECT_ID` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |

Example `.env` (private key stays on one line with `\n`):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

JWT_SECRET=some-long-random-secret
AUTH_TOKEN_EXPIRY_DAYS=7
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sportheroes
```

### 5. Phone auth testing tips

- **Android emulator / real device**: use a real phone number, or add **test phone numbers** in Authentication → Sign-in method → Phone → Phone numbers for testing (OTP is fixed, no SMS cost).
- **App Check / Play Integrity**: optional for later; not required for MVP.
- Billing: Phone Auth may require the Blaze plan depending on usage; check Firebase billing docs for your region.

---

## Part 2 — What is `idToken`?

After the user verifies OTP, Firebase creates a signed-in user on the device.

The Flutter Firebase Auth SDK can then produce an **ID token**:

- A JWT string issued by **Google/Firebase**
- Proves “this device just authenticated phone `+91XXXXXXXXXX` as Firebase user `uid_abc`”
- Short-lived (about 1 hour) — only used **once** to log into our API
- **Not** the same as our app JWT

Flow of tokens:

1. User completes OTP → Firebase session on device  
2. Flutter calls `user.getIdToken()` → **Firebase `idToken`**  
3. Flutter sends `idToken` to `POST /api/v1/auth/login`  
4. API returns **app `accessToken`** (7 days)  
5. Flutter stores `accessToken` and uses it for all other APIs  

The user never sees or types either token.

---

## Part 3 — Flutter (FE) flow

### Dependencies (Flutter)

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^latest
  firebase_auth: ^latest
  http: ^latest   # or dio
```

Initialize Firebase in `main.dart` (FlutterFire CLI is recommended: `flutterfire configure`).

### Step-by-step login UI

#### Step A — User enters phone number

```dart
// Example: +919876543210 (always use E.164 format)
final phoneNumber = '+91$localNumber';
```

#### Step B — Start Firebase phone verification

```dart
await FirebaseAuth.instance.verifyPhoneNumber(
  phoneNumber: phoneNumber,
  verificationCompleted: (PhoneAuthCredential credential) async {
    // Android auto-retrieval (optional path)
    await FirebaseAuth.instance.signInWithCredential(credential);
  },
  verificationFailed: (FirebaseAuthException e) {
    // Show error: invalid number, quota, etc.
  },
  codeSent: (String verificationId, int? resendToken) {
    // Save verificationId — needed when user enters OTP
  },
  codeAutoRetrievalTimeout: (String verificationId) {
    // Save verificationId as fallback
  },
);
```

Firebase sends the SMS OTP. Our backend is **not** involved yet.

#### Step C — User enters OTP

```dart
final credential = PhoneAuthProvider.credential(
  verificationId: verificationId,
  smsCode: otpCodeFromUser,
);

await FirebaseAuth.instance.signInWithCredential(credential);
```

User is now signed in with Firebase.

#### Step D — Get Firebase `idToken` and call our login API

```dart
final firebaseUser = FirebaseAuth.instance.currentUser;
if (firebaseUser == null) {
  throw Exception('Firebase sign-in failed');
}

// This is the idToken our backend expects
final idToken = await firebaseUser.getIdToken();

final response = await http.post(
  Uri.parse('http://YOUR_API_HOST:3000/api/v1/auth/login'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'idToken': idToken}),
);

final body = jsonDecode(response.body);
// body['data']['tokens']['accessToken']  → store this (7 days)
// body['data']['user']
// body['data']['isNewUser']
```

#### Step E — Complete profile if new user

If `isNewUser == true` or `user.isProfileComplete == false`:

```dart
await http.patch(
  Uri.parse('http://YOUR_API_HOST:3000/api/v1/auth/profile'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $accessToken', // our app JWT, not Firebase idToken
  },
  body: jsonEncode({
    'fullName': 'Rahul Sharma',
    'displayName': 'Rahul',
    'city': 'Mumbai',
    'country': 'India',
  }),
);
```

#### Step F — All later API calls

Use **only** the app JWT from login:

```dart
headers: {
  'Authorization': 'Bearer $accessToken',
}
```

Examples:

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout` (client should also delete the stored token)

Do **not** send the Firebase `idToken` on every request. Use it only for `/auth/login`.

---

## Part 4 — Backend API contract

Base path: `/api/v1/auth`  
Swagger: `http://localhost:3000/api/docs`

### `POST /api/v1/auth/login`

**Auth:** none (public)

**Body:**

```json
{
  "idToken": "<Firebase ID token from Flutter>"
}
```

**Success (existing user — 200, new user — 201):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "user": {
      "id": "uuid",
      "firebaseUid": "...",
      "phoneNumber": "+919876543210",
      "fullName": "...",
      "isProfileComplete": true,
      "...": "..."
    },
    "tokens": {
      "accessToken": "<app JWT>",
      "tokenType": "Bearer",
      "expiresIn": "7d",
      "expiresAt": "2026-07-11T00:00:00.000Z"
    }
  }
}
```

**What the backend does**

1. `firebase-admin` verifies `idToken`
2. Reads `uid` and `phone_number` from the token
3. Finds user by `firebase_uid`, or creates one
4. Signs our JWT (`JWT_SECRET`, expiry `AUTH_TOKEN_EXPIRY_DAYS`)

### `GET /api/v1/auth/me`

**Auth:** `Authorization: Bearer <app JWT>`

Returns the current user profile.

### `PATCH /api/v1/auth/profile`

**Auth:** `Authorization: Bearer <app JWT>`

Updates name, city, gender, etc. after first login.

### `POST /api/v1/auth/logout`

**Auth:** `Authorization: Bearer <app JWT>`

Acknowledges logout. JWT is stateless — Flutter must delete the stored token.

---

## Part 5 — Checklist

### Firebase Console

- [ ] Project created
- [ ] Phone sign-in enabled
- [ ] Android/iOS apps registered
- [ ] `google-services.json` / `GoogleService-Info.plist` in Flutter project
- [ ] Service account JSON created
- [ ] Optional: test phone numbers for development

### Backend `.env`

- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `JWT_SECRET`
- [ ] `AUTH_TOKEN_EXPIRY_DAYS=7`
- [ ] `DATABASE_URL`
- [ ] Migration applied: `npm run db:migrate:1`
- [ ] Prisma client: `npm run db:generate`
- [ ] Server running: `npm run dev`

### Flutter

- [ ] `firebase_core` + `firebase_auth` configured
- [ ] Phone OTP UI implemented
- [ ] After OTP: `getIdToken()` → `POST /api/v1/auth/login`
- [ ] Store `data.tokens.accessToken`
- [ ] If new user: `PATCH /api/v1/auth/profile`
- [ ] Use Bearer app JWT on protected routes

---

## FAQ

**Why doesn’t the API accept phone number + OTP directly?**  
SMS delivery, fraud protection, and OTP verification are handled by Firebase. The API only trusts tokens Firebase has already verified.

**Can I test login without Flutter?**  
Yes, but you still need a real Firebase ID token (from a device/emulator after OTP, or a custom token flow). You cannot invent a random `idToken` string.

**What if the Firebase token expires before login?**  
Call `getIdToken(true)` to force refresh, then call `/auth/login` again.

**What if our app JWT expires after 7 days?**  
User goes through phone OTP again → new Firebase `idToken` → `/auth/login` → new app JWT.

**Is `idToken` stored long-term?**  
No. Use it only to exchange for the app JWT, then discard it.
