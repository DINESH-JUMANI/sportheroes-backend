#!/usr/bin/env node
/**
 * E2E: Players module
 * Tests: player sport profiles CRUD
 *
 * Usage: npm run e2e:players
 * Prerequisite: npm run e2e:sports (needs sportIdTT / sportIdBAD)
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

const MODULE = 'Players E2E';

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
  const state = loadState();
  const sportIdTT = state.sportIdTT;
  const sportIdBAD = state.sportIdBAD;

  if (!sportIdTT || !sportIdBAD) {
    console.error('Run npm run e2e:sports first (need sportIdTT and sportIdBAD)');
    process.exit(1);
  }

  logStep('POST /api/v1/player-profiles (Table Tennis)');
  let createTT = await apiExpect('POST', '/api/v1/player-profiles', {
    token,
    body: { sportId: sportIdTT, skillLevel: 'intermediate', isPrimarySport: true },
  }, [200, 201, 409]);

  if (createTT.status === 409) {
    const existing = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
    const profiles = existing.data?.data?.profiles || [];
    const ttProfile = profiles.find((p) => p.sportId === sportIdTT);
    createTT = { data: { data: { profile: ttProfile } }, status: 200, ok: true };
  }
  assert(createTT.ok, 'Create TT player profile');
  const profileTTId = createTT.data?.data?.profile?.id;
  assert(!!profileTTId, 'TT profile has id');
  mergeState({ profileTTId });

  logStep('POST /api/v1/player-profiles (Badminton)');
  let createBAD = await apiExpect('POST', '/api/v1/player-profiles', {
    token,
    body: { sportId: sportIdBAD, skillLevel: 'beginner', isPrimarySport: false },
  }, [200, 201, 409]);
  if (createBAD.status === 409) {
    const existing = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
    const profiles = existing.data?.data?.profiles || [];
    const badProfile = profiles.find((p) => p.sportId === sportIdBAD);
    createBAD = { data: { data: { profile: badProfile } }, status: 200, ok: true };
  }
  assert(createBAD.ok, 'Create Badminton player profile');
  mergeState({ profileBADId: createBAD.data?.data?.profile?.id });

  logStep('GET /api/v1/player-profiles/me');
  const myProfiles = await apiExpect('GET', '/api/v1/player-profiles/me', { token }, 200);
  assert(myProfiles.ok, 'Get my profiles returns 200');
  assert((myProfiles.data?.data?.profiles?.length || 0) >= 1, 'User has at least 1 sport profile');

  logStep('GET /api/v1/player-profiles/user/:userId');
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
