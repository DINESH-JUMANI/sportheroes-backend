#!/usr/bin/env node
/**
 * E2E: Matches module
 * Tests: create, lifecycle, scoring, undo, timeline, list
 * Seeds: completed casual singles match (dev user 1 vs 2) + tournament match
 *
 * Usage: npm run e2e:matches
 */

const {
  assert,
  checkServer,
  apiExpect,
  devLogin,
  DEV_USER_1,
  DEV_USER_2,
  loadState,
  logStep,
  mergeState,
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Matches E2E';

async function getToken() {
  const state = loadState();
  if (state.token) return state.token;
  const { token } = await devLogin();
  mergeState({ token });
  return token;
}

/** Record N points for a side */
async function recordPoints(token, matchId, side, count) {
  for (let i = 0; i < count; i++) {
    const res = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
      token,
      body: { scoringSide: side },
    }, 200);
    if (!res.ok) return res;
  }
  return { ok: true };
}

/** Win one set (11 points, table tennis rules) */
async function winSet(token, matchId, side) {
  return recordPoints(token, matchId, side, 11);
}

/** Win best-of-5 match (3 sets) */
async function winMatch(token, matchId, winnerSide) {
  for (let s = 0; s < 3; s++) {
    const before = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
    if (before.data?.data?.match?.status === 'completed') return { ok: true };

    const res = await winSet(token, matchId, winnerSide);
    if (!res.ok) {
      const after = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
      if (after.data?.data?.match?.status === 'completed') return { ok: true };
      return res;
    }
  }
  const final = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
  return { ok: final.data?.data?.match?.status === 'completed' };
}

async function run() {
  resetCounters();
  console.log(`\n=== ${MODULE} ===`);

  if (!(await checkServer())) process.exit(1);

  const token = await getToken();
  const state = loadState();
  const sportId = state.sportIdTT;
  if (!sportId) {
    console.error('Run npm run e2e:sports first');
    process.exit(1);
  }

  logStep('POST /api/v1/matches (casual singles)');
  const created = await apiExpect('POST', '/api/v1/matches', {
    token,
    body: {
      sportId,
      matchType: 'singles',
      venue: 'E2E Court 1',
      participants: [
        { side: 'A', userId: DEV_USER_1.id },
        { side: 'B', userId: DEV_USER_2.id },
      ],
    },
  }, 201);
  assert(created.ok, 'Create match returns 201');
  const matchId = created.data?.data?.match?.id;
  assert(!!matchId, 'Match has id');
  assert(created.data?.data?.match?.status === 'scheduled', 'Match starts scheduled');
  mergeState({ matchId });

  logStep('GET /api/v1/matches/:id');
  const getOne = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
  assert(getOne.ok, 'Get match returns 200');

  logStep('POST /api/v1/matches/:id/start');
  const started = await apiExpect('POST', `/api/v1/matches/${matchId}/start`, { token }, 200);
  assert(started.ok, 'Start match returns 200');
  assert(started.data?.data?.match?.status === 'ongoing', 'Status is ongoing');

  logStep('POST /api/v1/matches/:id/point (record 3 points for A)');
  const pts = await recordPoints(token, matchId, 'A', 3);
  assert(pts.ok, 'Record points succeeds');

  logStep('POST /api/v1/matches/:id/undo-point');
  const undo = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  assert(undo.ok, 'Undo point returns 200');

  logStep('POST /api/v1/matches/:id/pause');
  const paused = await apiExpect('POST', `/api/v1/matches/${matchId}/pause`, { token }, 200);
  assert(paused.ok, 'Pause match returns 200');

  logStep('POST /api/v1/matches/:id/resume');
  const resumed = await apiExpect('POST', `/api/v1/matches/${matchId}/resume`, { token }, 200);
  assert(resumed.ok, 'Resume match returns 200');

  logStep('Complete match — win 3 sets for side A');
  const completed = await winMatch(token, matchId, 'A');
  assert(completed.ok, 'Match completes after 3 sets');

  const finalMatch = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
  assert(finalMatch.data?.data?.match?.status === 'completed', 'Final status is completed');
  assert(finalMatch.data?.data?.match?.winnerSide === 'A', 'Winner is side A');
  mergeState({ completedMatchId: matchId });

  logStep('GET /api/v1/matches/:id/timeline');
  const timeline = await apiExpect('GET', `/api/v1/matches/${matchId}/timeline`, {}, 200);
  assert(timeline.ok, 'Timeline returns 200');
  assert((timeline.data?.data?.timeline?.length || 0) > 0, 'Timeline has point events');

  logStep('GET /api/v1/matches (list)');
  const list = await apiExpect('GET', '/api/v1/matches', {
    query: { sportId, status: 'completed', page: 1, limit: 10 },
  }, 200);
  assert(list.ok, 'List matches returns 200');

  if (state.tournamentId && state.tournamentRoundId) {
    logStep('POST /api/v1/matches (tournament-linked)');
    const tMatch = await apiExpect('POST', '/api/v1/matches', {
      token,
      body: {
        sportId,
        matchType: 'singles',
        tournamentId: state.tournamentId,
        tournamentRoundId: state.tournamentRoundId,
        participants: [
          { side: 'A', userId: DEV_USER_1.id },
          { side: 'B', userId: DEV_USER_2.id },
        ],
      },
    }, 201);
    assert(tMatch.ok, 'Create tournament match returns 201');
    mergeState({ tournamentMatchId: tMatch.data?.data?.match?.id });
  }

  logStep('POST /api/v1/matches without auth (expect 401)');
  const noAuth = await apiExpect('POST', '/api/v1/matches', {
    body: { sportId, matchType: 'singles', participants: [] },
  }, 401);
  assert(noAuth.ok, 'Create without token returns 401');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
