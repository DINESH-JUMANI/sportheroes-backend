#!/usr/bin/env node
/**
 * E2E: Table Tennis specific rules (rotation, deuce, lets, faults, undo)
 *
 * Usage: node scripts/e2e/05b-tt-rules.e2e.js
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

const MODULE = 'Table Tennis Rules E2E';

async function run() {
  resetCounters();
  console.log(`\n=== ${MODULE} ===`);

  if (!(await checkServer())) process.exit(1);

  const { token } = await devLogin();
  const state = loadState();
  const sportId = state.sportIdTT;
  if (!sportId) {
    console.error('Run npm run e2e:sports first');
    process.exit(1);
  }

  logStep('1. Create TT Match');
  const created = await apiExpect('POST', '/api/v1/matches', {
    token,
    body: {
      sportId,
      matchType: 'singles',
      venue: 'TT Center',
      participants: [
        { side: 'A', phoneNumber: DEV_USER_1.phone },
        { side: 'B', phoneNumber: DEV_USER_2.phone },
      ],
    },
  }, 201);
  assert(created.ok, 'Create match returns 201');
  const matchId = created.data?.data?.match?.id;
  assert(!!matchId, 'Match has id');

  logStep('2. Start TT Match');
  const started = await apiExpect('POST', `/api/v1/matches/${matchId}/start`, { token }, 200);
  assert(started.ok, 'Start match returns 200');
  
  // Verify initial state
  let match = started.data?.data?.match;
  assert(match.currentServer === 'A', 'Default first server is A');
  assert(match.isDeuce === false, 'Not in deuce');

  logStep('3. Record normal points & check service rotation (every 2 points)');
  // A serves, A wins point (1-0). Server remains A.
  let p1 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'normal' }
  }, 200);
  assert(p1.data?.data?.match?.currentServer === 'A', 'After 1st point (1-0), server is A');

  // A serves, B wins point (1-1). Server switches to B (since total points = 2).
  let p2 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B', pointType: 'normal' }
  }, 200);
  assert(p2.data?.data?.match?.currentServer === 'B', 'After 2nd point (1-1), server is B');

  // B serves, B wins point (1-2). Server remains B.
  let p3 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B', pointType: 'normal' }
  }, 200);
  assert(p3.data?.data?.match?.currentServer === 'B', 'After 3rd point (1-2), server is B');

  // B serves, A wins point (2-2). Server switches to A.
  let p4 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'normal' }
  }, 200);
  assert(p4.data?.data?.match?.currentServer === 'A', 'After 4th point (2-2), server is A');

  logStep('4. Record a LET point (does not change score/server, logs as let)');
  // A serves, let point recorded. Score remains 2-2, server remains A.
  let pLet = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A', pointType: 'let' }
  }, 200);
  match = pLet.data?.data?.match;
  assert(match.sets[0].sideAScore === 2, 'Let did not increment A score');
  assert(match.sets[0].sideBScore === 2, 'Let did not increment B score');
  assert(match.currentServer === 'A', 'Let did not change server');

  // Check timeline shows let point and serverSide A
  const timeline = await apiExpect('GET', `/api/v1/matches/${matchId}/timeline`, {}, 200);
  const points = timeline.data?.data?.timeline;
  const lastPoint = points[points.length - 1];
  assert(lastPoint.pointType === 'let', 'Timeline shows pointType: let');
  assert(lastPoint.serverSide === 'A', 'Timeline shows serverSide: A');

  logStep('5. Record a service fault (gives point to opponent)');
  // A serves a service fault. Point goes to receiver B (2-3). Server remains A (since total score before fault was 2-2, so total = 4).
  let pFault = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B', pointType: 'service_fault' }
  }, 200);
  match = pFault.data?.data?.match;
  assert(match.sets[0].sideAScore === 2, 'A score remains 2');
  assert(match.sets[0].sideBScore === 3, 'B score incremented to 3');
  assert(match.currentServer === 'A', 'Fault server is A');

  // Timeline check for fault
  const timeline2 = await apiExpect('GET', `/api/v1/matches/${matchId}/timeline`, {}, 200);
  const lastPt2 = timeline2.data?.data?.timeline[timeline2.data.data.timeline.length - 1];
  assert(lastPt2.pointType === 'service_fault', 'Timeline shows pointType: service_fault');
  assert(lastPt2.serverSide === 'A', 'Timeline shows serverSide: A');

  logStep('6. Undo points and check score/server restoration');
  // Undo fault (should go back to 2-2, server A)
  let u1 = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  match = u1.data?.data?.match;
  assert(match.sets[0].sideAScore === 2 && match.sets[0].sideBScore === 2, 'Undo restored score to 2-2');
  assert(match.currentServer === 'A', 'Undo restored server to A');

  // Undo let (should go back to 2-2, server A)
  let u2 = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  match = u2.data?.data?.match;
  assert(match.sets[0].sideAScore === 2 && match.sets[0].sideBScore === 2, 'Undo let kept score at 2-2');
  assert(match.currentServer === 'A', 'Undo let kept server at A');

  // Undo point 4 (should go back to 1-2, server B)
  let u3 = await apiExpect('POST', `/api/v1/matches/${matchId}/undo-point`, { token }, 200);
  match = u3.data?.data?.match;
  assert(match.sets[0].sideAScore === 1 && match.sets[0].sideBScore === 2, 'Undo restored score to 1-2');
  assert(match.currentServer === 'B', 'Undo restored server to B');

  logStep('7. Fast-forward to deuce (10-10)');
  // We are currently at 1-2 (total = 3).
  // Let's bring A and B score to 10-10.
  // A is currently 1, B is currently 2.
  // Add 9 points for A (to reach 10) and 8 points for B (to reach 10).
  for (let i = 0; i < 9; i++) {
    await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'A' } }, 200);
  }
  for (let i = 0; i < 8; i++) {
    await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'B' } }, 200);
  }

  // Get current match status
  const deuceMatch = await apiExpect('GET', `/api/v1/matches/${matchId}`, {}, 200);
  match = deuceMatch.data?.data?.match;
  assert(match.sets[0].sideAScore === 10, 'A score is 10');
  assert(match.sets[0].sideBScore === 10, 'B score is 10');
  assert(match.isDeuce === true, 'isDeuce is true at 10-10');
  // At 10-10 (total = 20), turns = 20/1 = 20. Modulo is even, so initialServer of set 1 (A) serves.
  assert(match.currentServer === 'A', 'At 10-10, server is A');

  logStep('8. Check deuce service switch (switches EVERY point)');
  // A serves, wins point (11-10, total = 21). Server should switch to B immediately.
  let d1 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A' }
  }, 200);
  assert(d1.data?.data?.match?.currentServer === 'B', 'At 11-10, server is B');

  // B serves, wins point (11-11, total = 22). Server should switch to A immediately.
  let d2 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B' }
  }, 200);
  assert(d2.data?.data?.match?.currentServer === 'A', 'At 11-11, server is A');

  // A serves, wins point (12-11, total = 23). Server switches to B.
  let d3 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'A' }
  }, 200);
  assert(d3.data?.data?.match?.currentServer === 'B', 'At 12-11, server is B');

  // B serves, wins point (12-12, total = 24). Server switches to A.
  let d4 = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, {
    token,
    body: { scoringSide: 'B' }
  }, 200);
  assert(d4.data?.data?.match?.currentServer === 'A', 'At 12-12, server is A');

  logStep('9. Complete Set 1 & check Set 2 initial server alternation');
  // Score is 12-12. A serves. A wins point (13-12).
  await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'A' } }, 200);
  // B serves. A wins point (14-12). Set 1 ends.
  let set1End = await apiExpect('POST', `/api/v1/matches/${matchId}/point`, { token, body: { scoringSide: 'A' } }, 200);
  match = set1End.data?.data?.match;
  assert(match.sets[0].winnerSide === 'A', 'A wins Set 1');

  // Now, Set 2 starts. In Set 2, initialServer must alternate, so B serves first!
  // Before any points are recorded in Set 2, let's check who is currentServer.
  assert(match.currentServer === 'B', 'Set 2 initial server is B');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
