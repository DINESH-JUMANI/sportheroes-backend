#!/usr/bin/env node
/**
 * E2E: Sports module
 * Tests: list, get by code/id, create, update, soft-delete
 * Ensures MVP sports exist via seed
 *
 * Usage: npm run e2e:sports
 */

const { execSync } = require('child_process');
const path = require('path');
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

  logStep('Seed MVP sports (production-safe)');
  execSync('node scripts/run-migration.js 9.seed_sports.sql', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..'),
  });
  assert(true, 'Sports seed applied');

  const token = await getToken();

  logStep('GET /api/v1/sports');
  const list = await apiExpect('GET', '/api/v1/sports', { query: { page: 1, limit: 20 } }, 200);
  assert(list.ok, 'List sports returns 200');
  const sports = list.data?.data?.sports || [];
  assert(sports.length >= 4, 'At least 4 MVP sports present', `got ${sports.length}`);

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

  logStep('POST /api/v1/sports (create)');
  const create = await apiExpect('POST', '/api/v1/sports', {
    token,
    body: {
      name: 'Squash',
      code: 'SQ',
      isTeamSport: false,
      description: 'Racket sport played in a four-walled court',
      defaultMatchFormat: {
        sets_to_win: 3,
        best_of_sets: 5,
        points_per_set: 11,
        win_by_margin: 2,
        deuce_enabled: true,
      },
    },
  }, [201, 409]);
  assert(create.ok, 'Create sport returns 201 or already exists');

  let squashId = create.data?.data?.sport?.id;
  if (create.status === 409) {
    const existing = await apiExpect('GET', '/api/v1/sports/code/SQ', {}, 200);
    squashId = existing.data?.data?.sport?.id;
  }
  assert(!!squashId, 'Squash sport id available');
  mergeState({ sportIdSQ: squashId });

  logStep('PATCH /api/v1/sports/:id');
  const updated = await apiExpect('PATCH', `/api/v1/sports/${squashId}`, {
    token,
    body: { description: 'Indoor racket sport with a hollow rubber ball' },
  }, 200);
  assert(updated.ok, 'Update sport returns 200');

  logStep('DELETE /api/v1/sports/:id (soft delete)');
  const removed = await apiExpect('DELETE', `/api/v1/sports/${squashId}`, { token }, 200);
  assert(removed.ok, 'Soft-delete sport returns 200');
  assert(removed.data?.data?.sport?.isActive === false, 'Sport is deactivated');

  // Reactivate for cleanliness of future runs (optional)
  await apiExpect('PATCH', `/api/v1/sports/${squashId}`, {
    token,
    body: { isActive: true },
  }, 200);

  logStep('GET /api/v1/sports/invalid (expect 400)');
  const badId = await apiExpect('GET', '/api/v1/sports/not-a-uuid', {}, 400);
  assert(badId.ok, 'Invalid UUID returns 400');

  logStep('POST /api/v1/sports without auth (expect 401)');
  const noAuth = await apiExpect('POST', '/api/v1/sports', {
    body: { name: 'X', code: 'XX', defaultMatchFormat: { sets_to_win: 1, best_of_sets: 1, points_per_set: 1, win_by_margin: 1 } },
  }, 401);
  assert(noAuth.ok, 'Create without token returns 401');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
