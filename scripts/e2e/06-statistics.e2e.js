#!/usr/bin/env node
/**
 * E2E: Statistics module
 * Tests: player/team leaderboards and individual stats
 * Requires: completed match from e2e:matches (stats auto-recalculated)
 *
 * Usage: npm run e2e:statistics
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

const MODULE = 'Statistics E2E';

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

  await getToken();
  const state = loadState();
  const sportId = state.sportIdTT;
  const teamId = state.teamId;

  if (!sportId) {
    console.error('Run npm run e2e:sports first');
    process.exit(1);
  }

  logStep('GET /api/v1/statistics/players/leaderboard');
  const leaderboard = await apiExpect('GET', '/api/v1/statistics/players/leaderboard', {
    query: { sportId, page: 1, limit: 20, sortBy: 'ranking_points' },
  }, 200);
  assert(leaderboard.ok, 'Player leaderboard returns 200');

  if (state.completedMatchId) {
    const entries = leaderboard.data?.data?.leaderboard || [];
    const devEntry = entries.find((e) => e.userId === DEV_USER_1.id);
    assert(!!devEntry, 'Dev user 1 appears on leaderboard after completed match');
    if (devEntry) {
      assert(devEntry.matchesPlayed >= 1, 'Dev user has matches_played >= 1');
      assert(devEntry.matchesWon >= 1, 'Dev user has matches_won >= 1');
      assert(devEntry.currentRankingPoints >= 10, 'Dev user gained ranking points');
    }
  } else {
    console.log('    ⚠ No completedMatchId — run e2e:matches for full stats assertions');
  }

  logStep('GET /api/v1/statistics/players/:userId');
  const playerStats = await apiExpect(
    'GET',
    `/api/v1/statistics/players/${DEV_USER_1.id}`,
    { query: { sportId } },
    200,
  );
  assert(playerStats.ok, 'Player stats returns 200');
  const stats = playerStats.data?.data?.stats || [];
  if (state.completedMatchId && stats.length > 0) {
    assert(stats[0].matchesPlayed >= 1, 'Player stats show completed match');
  }

  logStep('GET /api/v1/statistics/players/leaderboard?sortBy=win_percentage');
  const byWinPct = await apiExpect('GET', '/api/v1/statistics/players/leaderboard', {
    query: { sportId, sortBy: 'win_percentage', page: 1, limit: 10 },
  }, 200);
  assert(byWinPct.ok, 'Leaderboard by win_percentage returns 200');

  if (teamId) {
    logStep('GET /api/v1/statistics/teams/:teamId');
    const teamStats = await apiExpect('GET', `/api/v1/statistics/teams/${teamId}`, {}, 200);
    assert(teamStats.ok, 'Team stats returns 200');

    logStep('GET /api/v1/statistics/teams/leaderboard');
    const teamLb = await apiExpect('GET', '/api/v1/statistics/teams/leaderboard', {
      query: { sportId, page: 1, limit: 20 },
    }, 200);
    assert(teamLb.ok, 'Team leaderboard returns 200');
  }

  logStep('GET /api/v1/statistics/players/leaderboard without sportId (expect 400)');
  const badQuery = await apiExpect('GET', '/api/v1/statistics/players/leaderboard', {
    query: { page: 1 },
  }, 400);
  assert(badQuery.ok, 'Missing sportId returns 400');

  logStep('GET /api/v1/statistics/players/invalid-uuid (expect 400)');
  const badUser = await apiExpect('GET', '/api/v1/statistics/players/not-uuid', {}, 400);
  assert(badUser.ok, 'Invalid userId returns 400');

  printSummary(MODULE);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
