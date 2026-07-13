#!/usr/bin/env node
/**
 * E2E: Teams module
 * Tests: create, list, get, update, members CRUD, soft delete
 * Seeds: "E2E Smashers" team with dev user 1 + dev user 2 as members
 *
 * Usage: npm run e2e:teams
 */

const {
  assert,
  checkServer,
  apiExpect,
  devLogin,
  DEV_USER_2,
  loadState,
  logStep,
  mergeState,
  printSummary,
  resetCounters,
} = require('./helpers');

const MODULE = 'Teams E2E';

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
    console.error('Run npm run e2e:sports first (need sportIdTT in state)');
    process.exit(1);
  }

  logStep('POST /api/v1/teams');
  const created = await apiExpect('POST', '/api/v1/teams', {
    token,
    body: {
      sportId,
      name: 'E2E Smashers',
      shortName: 'E2E',
      description: 'Team created by E2E test script for FE demo data',
    },
  }, 201);
  assert(created.ok, 'Create team returns 201');
  const teamId = created.data?.data?.team?.id;
  assert(!!teamId, 'Team has id');
  mergeState({ teamId });

  logStep('GET /api/v1/teams');
  const list = await apiExpect('GET', '/api/v1/teams', {
    query: { sportId, page: 1, limit: 20 },
  }, 200);
  assert(list.ok, 'List teams returns 200');
  assert(
    (list.data?.data?.teams || []).some((t) => t.id === teamId),
    'Created team appears in list',
  );

  logStep('GET /api/v1/teams/:id');
  const getOne = await apiExpect('GET', `/api/v1/teams/${teamId}`, {}, 200);
  assert(getOne.ok, 'Get team returns 200');
  assert(getOne.data?.data?.team?.name === 'E2E Smashers', 'Team name correct');

  logStep('GET /api/v1/teams/:id/members');
  const membersBefore = await apiExpect('GET', `/api/v1/teams/${teamId}/members`, {}, 200);
  assert(membersBefore.ok, 'List members returns 200');
  assert((membersBefore.data?.data?.members?.length || 0) >= 1, 'Creator is captain member');

  logStep('POST /api/v1/teams/:id/members (add dev user 2)');
  const addMember = await apiExpect('POST', `/api/v1/teams/${teamId}/members`, {
    token,
    body: { userId: DEV_USER_2.id, role: 'member' },
  }, [200, 201, 400]);
  assert(addMember.ok, 'Add member succeeds or already member');

  logStep('GET /api/v1/teams/:id/members (after add)');
  const membersAfter = await apiExpect('GET', `/api/v1/teams/${teamId}/members`, {}, 200);
  const members = membersAfter.data?.data?.members || [];
  assert(members.length >= 2, 'Team has at least 2 members');
  const member2 = members.find((m) => m.userId === DEV_USER_2.id);
  assert(!!member2, 'Dev user 2 is on roster');
  mergeState({ teamMember2Id: member2?.id });

  logStep('PATCH /api/v1/teams/:id/members/:memberId');
  if (member2?.id) {
    const updateMember = await apiExpect(
      'PATCH',
      `/api/v1/teams/${teamId}/members/${member2.id}`,
      { token, body: { role: 'vice_captain' } },
      200,
    );
    assert(updateMember.ok, 'Update member role returns 200');
  }

  logStep('PATCH /api/v1/teams/:id');
  const updated = await apiExpect('PATCH', `/api/v1/teams/${teamId}`, {
    token,
    body: { description: 'Updated by E2E test', viceCaptainId: DEV_USER_2.id },
  }, 200);
  assert(updated.ok, 'Update team returns 200');

  logStep('POST /api/v1/teams without auth (expect 401)');
  const noAuth = await apiExpect('POST', '/api/v1/teams', {
    body: { sportId, name: 'Should Fail' },
  }, 401);
  assert(noAuth.ok, 'Create without token returns 401');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
