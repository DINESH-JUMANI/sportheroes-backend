#!/usr/bin/env node
/**
 * E2E: Auth module
 * Tests: dev-login, me, profile update, logout
 * Seeds: dev users in DB (migrations 7 & 8)
 *
 * Usage: npm run e2e:auth
 * Prerequisite: npm run dev (server running)
 */

const {
  assert,
  checkServer,
  apiExpect,
  devLogin,
  ensureDevUsers,
  logStep,
  mergeState,
  pass,
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Auth E2E';

async function run() {
  resetCounters();
  console.log(`\n=== ${MODULE} ===`);

  if (!(await checkServer())) process.exit(1);

  logStep('Seed dev users (migrations 7 & 8)');
  await ensureDevUsers();
  pass('Dev users seeded in local DB');

  logStep('POST /api/v1/auth/dev-login');
  const { token, user } = await devLogin();
  assert(!!token, 'dev-login returns accessToken');
  assert(user.id === 'a0000000-0000-4000-8000-000000000001', 'dev-login returns dev user 1');
  mergeState({ token, userId: user.id });

  logStep('GET /api/v1/auth/me');
  const me = await apiExpect('GET', '/api/v1/auth/me', { token }, 200);
  assert(me.ok, 'GET /me returns 200');
  assert(me.data?.data?.user?.fullName === 'Dev Tester', 'GET /me returns correct user');

  logStep('PATCH /api/v1/auth/profile');
  const profile = await apiExpect('PATCH', '/api/v1/auth/profile', {
    token,
    body: {
      fullName: 'Dev Tester',
      displayName: 'Dev',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      gender: 'male',
    },
  }, 200);
  assert(profile.ok, 'PATCH /profile returns 200');
  assert(profile.data?.data?.user?.city === 'Mumbai', 'Profile city updated');

  logStep('POST /api/v1/auth/logout');
  const logout = await apiExpect('POST', '/api/v1/auth/logout', { token }, 200);
  assert(logout.ok, 'POST /logout returns 200');

  logStep('GET /api/v1/auth/me without token (expect 401)');
  const noAuth = await apiExpect('GET', '/api/v1/auth/me', {}, 401);
  assert(noAuth.ok, 'GET /me without token returns 401');

  logStep('Re-login for downstream E2E scripts');
  const { token: freshToken } = await devLogin();
  mergeState({ token: freshToken });

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
