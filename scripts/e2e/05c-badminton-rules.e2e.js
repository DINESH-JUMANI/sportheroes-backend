#!/usr/bin/env node
/**
 * E2E: Badminton specific rules (rotation, deuce, lets, faults, undo)
 *
 * Usage: node scripts/e2e/05c-badminton-rules.e2e.js
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
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Badminton Rules E2E';

async function run() {
  resetCounters();
  console.log(`\n=== ${MODULE} ===`);

  if (!(await checkServer())) process.exit(1);

  const { token } = await devLogin();
  const state = loadState();
  const sportId = state.sportIdBAD;
  if (!sportId) {
    console.error('Run npm run e2e:sports first');
    process.exit(1);
  }

  logStep('1. Create Badminton Match');
  const created = await apiExpect('POST', '/api/v1/matches', {
    token,
    body: {
      sportId,
      matchType: 'singles',
      venue: 'Badminton Court 3',
      participants: [
        { side: 'A', phoneNumber: DEV_USER_1.phone },
        { side: 'B', phoneNumber: DEV_USER_2.phone },
      ],
    },
  }, 201);
  assert(created.ok, 'Create match returns 201');
  const matchId = created.data?.data?.match?.id;
  assert(!!matchId, 'Match has id');

  logStep('2. Start Badminton Match');
  const started = await apiExpect('POST', `/api/v1/matches/${matchId}/start`, { token }, 200);
  assert(started.ok, 'Start match returns 200');
  
  // Verify initial state
  let match = started.data?.data?.match;
  assert(match.currentServer === 'A', 'Default first server is A');
  assert(match.isDeuce === false, 'Not in deuce');

  logStep('3. Record normal points & check Badminton service rotation (winner of rally serves)');
  // A serves, A wins point (1-0). Next server is A.
  let p1 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'normal' }
  }, 200);
  assert(p1.data?.data?.match?.currentServer === 'A', 'After A wins point (1-0), server is A');

  // A serves, B wins point (1-1). Next server is B.
  let p2 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B', pointType: 'normal' }
  }, 200);
  assert(p2.data?.data?.match?.currentServer === 'B', 'After B wins point (1-1), server is B');

  // B serves, A wins point (2-1). Next server is A.
  let p3 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'normal' }
  }, 200);
  assert(p3.data?.data?.match?.currentServer === 'A', 'After A wins point (2-1), server is A');

  logStep('4. Record a LET point (does not change score or server)');
  // A serves, let point recorded. Score remains 2-1, server remains A.
  let pLet = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'let' }
  }, 200);
  match = pLet.data?.data?.match;
  assert(match.sets[0].sideAScore === 2, 'Let did not increment A score');
  assert(match.sets[0].sideBScore === 1, 'Let did not increment B score');
  assert(match.currentServer === 'A', 'Let did not change server');

  // Check timeline shows let point and serverSide A
  const timeline = await apiExpect('GET', `/api/v1/matches/${matchId}/timeline`, {}, 200);
  const points = timeline.data?.data?.timeline;
  const lastPoint = points[points.length - 1];
  console.log('DEBUG lastPoint:', lastPoint);
  assert(lastPoint.pointType === 'let', 'Timeline shows pointType: let');
  assert(lastPoint.serverSide === 'A', 'Timeline shows serverSide: A');

  logStep('5. Record a service fault (gives point to opponent)');
  // A serves a service fault. Point goes to receiver B (2-2). Next server is B.
  let pFault = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B', pointType: 'service_fault' }
  }, 200);
  match = pFault.data?.data?.match;
  assert(match.sets[0].sideAScore === 2, 'A score remains 2');
  assert(match.sets[0].sideBScore === 2, 'B score incremented to 2');
  assert(match.currentServer === 'B', 'Next server after B wins point is B');

  logStep('6. Undo points and check score/server restoration');
  // Undo fault (should go back to 2-1, server A)
  let u1 = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  match = u1.data?.data?.match;
  assert(match.sets[0].sideAScore === 2 && match.sets[0].sideBScore === 1, 'Undo restored score to 2-1');
  assert(match.currentServer === 'A', 'Undo restored server to A');

  // Undo let (should go back to 2-1, server A)
  let u2 = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  match = u2.data?.data?.match;
  assert(match.sets[0].sideAScore === 2 && match.sets[0].sideBScore === 1, 'Undo let kept score at 2-1');
  assert(match.currentServer === 'A', 'Undo let kept server at A');

  logStep('7. Fast-forward to deuce (20-20)');
  // We are currently at 2-1 (total = 3).
  // Bring A and B score to 20-20.
  // Add 18 points for A (to reach 20) and 19 points for B (to reach 20).
  for (let i = 0; i < 18; i++) {
    await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'A' } }, 200);
  }
  for (let i = 0; i < 19; i++) {
    await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'B' } }, 200);
  }

  // Get current match status
  const deuceMatch = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
  match = deuceMatch.data?.data?.match;
  assert(match.sets[0].sideAScore === 20, 'A score is 20');
  assert(match.sets[0].sideBScore === 20, 'B score is 20');
  assert(match.isDeuce === true, 'isDeuce is true at 20-20');

  logStep('8. Complete Set 1 & check Set 2 initial server (winner of Set 1 serves first)');
  // Score is 20-20. B wins point (20-21). B serves.
  await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'B' } }, 200);
  // B wins point (20-22). B wins Set 1.
  let set1End = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'B' } }, 200);
  match = set1End.data?.data?.match;
  assert(match.sets[0].winnerSide === 'B', 'B wins Set 1');

  // Now, Set 2 starts. Winner of previous set (B) must serve first.
  assert(match.currentServer === 'B', 'Set 2 initial server is B');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
