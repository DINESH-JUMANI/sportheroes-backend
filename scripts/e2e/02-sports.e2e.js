#!/usr/bin/env node
/**
 * E2E: Sports module
 * Tests: list sports, get by code/id, player sport profiles CRUD
 * Seeds: player sport profiles for dev user (Table Tennis + Badminton)
 *
 * Usage: npm run e2e:sports
 */

const {
  assert,
  checkServer,
  apiExpect,
  devLogin,
  loadState,
  logStep,
  mergeState,
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Sports E2E';

async function getToken() {
  const state = loadState();
  if (state.token) return state.token;
  const { token } = await devLogin();
  mergeState({ token });
  return token;
}

async function run() {
  resetCounters();
  console.log(`\n=== ${MODULE} ===`);

  if (!(await checkServer())) process.exit(1);

  const token = await getToken();

  logStep('GET /api/v1/sports');
  const list = await apiExpect('GET', '/api/v1/sports', { query: { page: 1, limit: 20 } }, 200);
  assert(list.ok, 'List sports returns 200');
  const sports = list.data?.data?.sports || [];
  assert(sports.length >= 4, 'At least 4 MVP sports seeded', `got ${sports.length}`);

  const tableTennis = sports.find((s) => s.code === 'TT');
  const badminton = sports.find((s) => s.code === 'BAD');
  assert(!!tableTennis, 'Table Tennis sport exists');
  assert(!!badminton, 'Badminton sport exists');
  mergeState({ sportIdTT: tableTennis?.id, sportIdBAD: badminton?.id });

  logStep('GET /api/v1/sports/code/TT');
  const byCode = await apiExpect('GET', '/api/v1/sports/code/TT', {}, 200);
  assert(byCode.ok, 'Get sport by code returns 200');
  assert(byCode.data?.data?.sport?.code === 'TT', 'Sport code is TT');

  logStep('GET /api/v1/sports/:id');
  const byId = await apiExpect('GET', `/api/v1/sports/${tableTennis.id}`, {}, 200);
  assert(byId.ok, 'Get sport by ID returns 200');

  logStep('GET /api/v1/sports/invalid (expect 400)');
  const badId = await apiExpect('GET', '/api/v1/sports/not-a-uuid', {}, 400);
  assert(badId.ok, 'Invalid UUID returns 400');

  logStep('POST /api/v1/player-profiles (Table Tennis)');
  let createTT = await apiExpect('POST', '/api/v1/player-profiles', {
    token,
    body: { sportId: tableTennis.id, skillLevel: 'intermediate', isPrimarySport: true },
  }, [200, 201, 409]);

  if (createTT.status === 409) {
    logStep('Profile exists — fetch existing profiles');
    const existing = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
    const profiles = existing.data?.data?.profiles || [];
    const ttProfile = profiles.find((p) => p.sportId === tableTennis.id);
    createTT = { data: { data: { profile: ttProfile } }, status: 200, ok: true };
  }
  assert(createTT.ok, 'Create TT player profile');
  const profileTTId = createTT.data?.data?.profile?.id;
  assert(!!profileTTId, 'TT profile has id');
  mergeState({ profileTTId });

  logStep('POST /api/v1/player-profiles (Badminton)');
  let createBAD = await apiExpect('POST', '/api/v1/player-profiles', {
    token,
    body: { sportId: badminton.id, skillLevel: 'beginner', isPrimarySport: false },
  }, [200, 201, 409]);
  if (createBAD.status === 409) {
    const existing = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
    const profiles = existing.data?.data?.profiles || [];
    const badProfile = profiles.find((p) => p.sportId === badminton.id);
    createBAD = { data: { data: { profile: badProfile } }, status: 200, ok: true };
  }
  assert(createBAD.ok, 'Create Badminton player profile');
  mergeState({ profileBADId: createBAD.data?.data?.profile?.id });

  logStep('GET /api/v1/player-profiles/me');
  const myProfiles = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
  assert(myProfiles.ok, 'Get my profiles returns 200');
  assert((myProfiles.data?.data?.profiles?.length || 0) >= 1, 'User has at least 1 sport profile');

  logStep('GET /api/v1/player-profiles/user/:userId');
  const state = loadState();
  const userProfiles = await apiExpect(
    'GET',
    `/api/v1/player-profiles/user/${state.userId || 'a0000000-0000-4000-8000-000000000001'}`,
    { token },
    200,
  );
  assert(userProfiles.ok, 'Get user profiles returns 200');

  logStep('PATCH /api/v1/player-profiles/:id');
  const updated = await apiExpect('PATCH', `/api/v1/player-profiles/${profileTTId}`, {
    token,
    body: { skillLevel: 'advanced' },
  }, 200);
  assert(updated.ok, 'Update profile returns 200');
  assert(updated.data?.data?.profile?.skillLevel === 'advanced', 'Skill level updated');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
