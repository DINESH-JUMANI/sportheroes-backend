#!/usr/bin/env node
/**
 * E2E: Tournaments module
 * Tests: CRUD, status, participants, rounds, standings
 * Seeds: "E2E Open Table Tennis 2026" tournament with registration + participant
 *
 * Usage: npm run e2e:tournaments
 */

const {
  assert,
  checkServer,
  apiExpect,
  devLogin,
  DEV_USER_1,
  loadState,
  logStep,
  mergeState,
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Tournaments E2E';

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
  const sportId = state.sportIdTT;
  if (!sportId) {
    console.error('Run npm run e2e:sports first');
    process.exit(1);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);
  const fmt = (d) => d.toISOString().slice(0, 10);

  logStep('POST /api/v1/tournaments');
  const created = await apiExpect('POST', '/api/v1/tournaments', {
    token,
    body: {
      sportId,
      name: 'E2E Open Table Tennis 2026',
      format: 'league',
      participantKind: 'individual',
      description: 'Tournament seeded by E2E script for FE demo',
      venue: 'E2E Sports Hall',
      city: 'Mumbai',
      country: 'India',
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      maxParticipants: 32,
    },
  }, 201);
  assert(created.ok, 'Create tournament returns 201');
  const tournamentId = created.data?.data?.tournament?.id;
  assert(!!tournamentId, 'Tournament has id');
  assert(created.data?.data?.tournament?.status === 'draft', 'Initial status is draft');
  mergeState({ tournamentId });

  logStep('GET /api/v1/tournaments');
  const list = await apiExpect('GET', '/api/v1/tournaments', {
    query: { sportId, page: 1, limit: 20 },
  }, 200);
  assert(list.ok, 'List tournaments returns 200');

  logStep('GET /api/v1/tournaments/:id');
  const getOne = await apiExpect('GET', `/api/v1/tournaments/${tournamentId}`, {}, 200);
  assert(getOne.ok, 'Get tournament returns 200');

  logStep('PATCH /api/v1/tournaments/:id/status → registration_open');
  const openReg = await apiExpect('PATCH', `/api/v1/tournaments/${tournamentId}/status`, {
    token,
    body: { status: 'registration_open' },
  }, 200);
  assert(openReg.ok, 'Open registration returns 200');
  assert(
    openReg.data?.data?.tournament?.status === 'registration_open',
    'Status is registration_open',
  );

  logStep('POST /api/v1/tournaments/:id/participants');
  const register = await apiExpect('POST', `/api/v1/tournaments/${tournamentId}/participants`, {
    token,
    body: { userId: DEV_USER_1.id, seedNumber: 1 },
  }, [200, 201, 400]);
  assert(register.ok, 'Register participant');
  const participantId = register.data?.data?.participant?.id;
  mergeState({ tournamentParticipantId: participantId });

  logStep('GET /api/v1/tournaments/:id/participants');
  const participants = await apiExpect(
    'GET',
    `/api/v1/tournaments/${tournamentId}/participants`,
    {},
    200,
  );
  assert(participants.ok, 'List participants returns 200');
  assert((participants.data?.data?.participants?.length || 0) >= 1, 'Has participants');

  if (participantId) {
    logStep('PATCH /api/v1/tournaments/:id/participants/:participantId');
    const confirm = await apiExpect(
      'PATCH',
      `/api/v1/tournaments/${tournamentId}/participants/${participantId}`,
      { token, body: { status: 'confirmed', seedNumber: 1 } },
      200,
    );
    assert(confirm.ok, 'Confirm participant returns 200');
  }

  logStep('POST /api/v1/tournaments/:id/rounds');
  const round = await apiExpect('POST', `/api/v1/tournaments/${tournamentId}/rounds`, {
    token,
    body: { roundNumber: 1, roundName: 'Round 1' },
  }, 201);
  assert(round.ok, 'Create round returns 201');
  const roundId = round.data?.data?.round?.id;
  mergeState({ tournamentRoundId: roundId });

  logStep('GET /api/v1/tournaments/:id/rounds');
  const rounds = await apiExpect('GET', `/api/v1/tournaments/${tournamentId}/rounds`, {}, 200);
  assert(rounds.ok, 'List rounds returns 200');

  logStep('GET /api/v1/tournaments/:id/standings');
  const standings = await apiExpect(
    'GET',
    `/api/v1/tournaments/${tournamentId}/standings`,
    {},
    200,
  );
  assert(standings.ok, 'Get standings returns 200');
  assert((standings.data?.data?.standings?.length || 0) >= 1, 'Standings row created on register');

  logStep('PATCH /api/v1/tournaments/:id');
  const updated = await apiExpect('PATCH', `/api/v1/tournaments/${tournamentId}`, {
    token,
    body: { venue: 'Updated E2E Venue' },
  }, 200);
  assert(updated.ok, 'Update tournament returns 200');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
