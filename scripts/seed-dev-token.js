/**
 * Seeds the dev test user and prints a 1-year JWT for Swagger/API testing.
 *
 * Usage: npm run db:seed:dev
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');
const path = require('path');

const DEV_USER_ID = 'a0000000-0000-4000-8000-000000000001';
const DEV_FIREBASE_UID = 'dev-sportheroes-test-user';
const DEV_PHONE = '+919000000001';
const DEV_TOKEN_DAYS = 365;

async function main() {
  console.log('\n=== SportHeroes Dev Seed ===\n');

  // Run SQL migrations for both dev users
  const root = path.join(__dirname, '..');
  const migrationScript = path.join(__dirname, 'run-migration.js');
  execSync(`node "${migrationScript}" 7.seed_dev_user.sql`, { stdio: 'inherit', cwd: root });
  execSync(`node "${migrationScript}" 8.seed_dev_user_2.sql`, { stdio: 'inherit', cwd: root });

  const jwtSecret = process.env.JWT_SECRET;
  const jwtIssuer = process.env.JWT_ISSUER || 'sportheroes-api';

  if (!jwtSecret) {
    console.error('\nERROR: JWT_SECRET is not set in .env');
    process.exit(1);
  }

  const expiresInSeconds = DEV_TOKEN_DAYS * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const accessToken = jwt.sign(
    {
      sub: DEV_USER_ID,
      firebaseUid: DEV_FIREBASE_UID,
      phoneNumber: DEV_PHONE,
    },
    jwtSecret,
    {
      expiresIn: expiresInSeconds,
      issuer: jwtIssuer,
    },
  );

  console.log('\n--- Dev user seeded successfully ---');
  console.log(`User ID:       ${DEV_USER_ID}`);
  console.log(`Phone:         ${DEV_PHONE}`);
  console.log(`Email:         dev.tester@sportheroes.local`);
  console.log(`Expires:       ${expiresAt.toISOString()} (${DEV_TOKEN_DAYS} days)`);
  console.log('\n--- Copy this token for Swagger Authorize or API calls ---\n');
  console.log(accessToken);
  console.log('\n--- Or call POST /api/v1/auth/dev-login (NODE_ENV=development) ---\n');
  console.log('Header: Authorization: Bearer <token above>\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
