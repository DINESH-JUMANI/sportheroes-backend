/**
 * One-time repair: set winner_side on completed matches missing it,
 * then rebuild all player/team statistics.
 *
 * Usage: node scripts/repair-stats.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseFormat(value) {
  const format = value || {};
  return {
    sets_to_win: format.sets_to_win ?? 2,
    best_of_sets: format.best_of_sets ?? 3,
    points_per_set: format.points_per_set ?? 11,
    win_by_margin: format.win_by_margin ?? 2,
    deciding_set_points: format.deciding_set_points,
  };
}

function isSetWon(a, b, format, setNumber) {
  const pointsToWin =
    format.deciding_set_points && setNumber === format.best_of_sets
      ? format.deciding_set_points
      : format.points_per_set;
  if (a >= pointsToWin && a - b >= format.win_by_margin) return 'A';
  if (b >= pointsToWin && b - a >= format.win_by_margin) return 'B';
  return null;
}

function resolveWinner(sets, format) {
  const projected = sets.map((set) => {
    if (set.winnerSide === 'A' || set.winnerSide === 'B') return set.winnerSide;
    const byRules = isSetWon(set.sideAScore, set.sideBScore, format, set.setNumber);
    if (byRules) return byRules;
    if (set.sideAScore > set.sideBScore) return 'A';
    if (set.sideBScore > set.sideAScore) return 'B';
    return null;
  });

  const wins = { A: 0, B: 0 };
  for (const w of projected) {
    if (w === 'A') wins.A += 1;
    if (w === 'B') wins.B += 1;
  }
  if (wins.A >= format.sets_to_win) return 'A';
  if (wins.B >= format.sets_to_win) return 'B';
  if (wins.A > wins.B) return 'A';
  if (wins.B > wins.A) return 'B';

  const pointsA = sets.reduce((s, set) => s + set.sideAScore, 0);
  const pointsB = sets.reduce((s, set) => s + set.sideBScore, 0);
  if (pointsA > pointsB) return 'A';
  if (pointsB > pointsA) return 'B';
  return null;
}

function calcWinPct(won, played) {
  if (played === 0) return 0;
  return Math.round((won / played) * 10000) / 100;
}

async function upsertPlayer(userId, sportId, won, setsWon, setsLost, pointsScored, pointsConceded) {
  const existing = await prisma.playerStatistics.findUnique({
    where: { userId_sportId: { userId, sportId } },
  });
  const matchesPlayed = (existing?.matchesPlayed ?? 0) + 1;
  const matchesWon = (existing?.matchesWon ?? 0) + (won ? 1 : 0);
  const matchesLost = (existing?.matchesLost ?? 0) + (won ? 0 : 1);
  const stats = {
    matchesPlayed,
    matchesWon,
    matchesLost,
    setsWon: (existing?.setsWon ?? 0) + setsWon,
    setsLost: (existing?.setsLost ?? 0) + setsLost,
    totalPointsScored: (existing?.totalPointsScored ?? 0) + pointsScored,
    totalPointsConceded: (existing?.totalPointsConceded ?? 0) + pointsConceded,
    winPercentage: calcWinPct(matchesWon, matchesPlayed),
    currentRankingPoints: (existing?.currentRankingPoints ?? 0) + (won ? 10 : 0),
  };
  if (existing) {
    await prisma.playerStatistics.update({ where: { id: existing.id }, data: stats });
  } else {
    await prisma.playerStatistics.create({ data: { userId, sportId, ...stats } });
  }
  await prisma.playerSportProfile.updateMany({
    where: { userId, sportId },
    data: { rankingPoints: stats.currentRankingPoints },
  });
}

async function upsertTeam(teamId, won, setsWon, setsLost) {
  const existing = await prisma.teamStatistics.findUnique({ where: { teamId } });
  const matchesPlayed = (existing?.matchesPlayed ?? 0) + 1;
  const matchesWon = (existing?.matchesWon ?? 0) + (won ? 1 : 0);
  const matchesLost = (existing?.matchesLost ?? 0) + (won ? 0 : 1);
  const stats = {
    matchesPlayed,
    matchesWon,
    matchesLost,
    setsWon: (existing?.setsWon ?? 0) + setsWon,
    setsLost: (existing?.setsLost ?? 0) + setsLost,
    winPercentage: calcWinPct(matchesWon, matchesPlayed),
  };
  if (existing) {
    await prisma.teamStatistics.update({ where: { id: existing.id }, data: stats });
  } else {
    await prisma.teamStatistics.create({ data: { teamId, ...stats } });
  }
}

async function main() {
  const completed = await prisma.match.findMany({
    where: { status: 'completed' },
    include: { sets: true, participants: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${completed.length} completed matches`);

  for (const match of completed) {
    const format = parseFormat(match.matchFormat);

    for (const set of match.sets) {
      if (set.winnerSide) continue;
      const w =
        isSetWon(set.sideAScore, set.sideBScore, format, set.setNumber) ||
        (set.sideAScore > set.sideBScore ? 'A' : set.sideBScore > set.sideAScore ? 'B' : null);
      if (w) {
        await prisma.matchSet.update({
          where: { id: set.id },
          data: { winnerSide: w, endedAt: set.endedAt ?? new Date() },
        });
        set.winnerSide = w;
      }
    }

    let winner = match.winnerSide;
    if (!winner) {
      winner = resolveWinner(match.sets, format);
      if (!winner) {
        console.log(`SKIP ${match.id} — cannot determine winner`);
        continue;
      }
      await prisma.match.update({
        where: { id: match.id },
        data: { winnerSide: winner, finishedAt: match.finishedAt ?? new Date() },
      });
      console.log(`Set winner_side=${winner} for ${match.id}`);
    }

    await prisma.matchParticipant.updateMany({
      where: { matchId: match.id },
      data: { isWinner: false },
    });
    await prisma.matchParticipant.updateMany({
      where: { matchId: match.id, side: winner },
      data: { isWinner: true },
    });
  }

  // Full rebuild
  await prisma.playerStatistics.deleteMany({});
  await prisma.teamStatistics.updateMany({
    data: {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      winPercentage: 0,
    },
  });
  await prisma.playerSportProfile.updateMany({ data: { rankingPoints: 0 } });

  const withWinner = await prisma.match.findMany({
    where: { status: 'completed', winnerSide: { not: null } },
    include: { sets: true, participants: true },
    orderBy: { finishedAt: 'asc' },
  });

  for (const match of withWinner) {
    const winnerSide = match.winnerSide;
    const loserSide = winnerSide === 'A' ? 'B' : 'A';
    const winnerSets = match.sets.filter((s) => s.winnerSide === winnerSide).length;
    const loserSets = match.sets.filter((s) => s.winnerSide === loserSide).length;
    const winnerPoints = match.sets.reduce(
      (sum, s) => sum + (winnerSide === 'A' ? s.sideAScore : s.sideBScore),
      0,
    );
    const loserPoints = match.sets.reduce(
      (sum, s) => sum + (loserSide === 'A' ? s.sideAScore : s.sideBScore),
      0,
    );

    for (const p of match.participants) {
      const won = p.side === winnerSide;
      if (p.userId) {
        await upsertPlayer(
          p.userId,
          match.sportId,
          won,
          won ? winnerSets : loserSets,
          won ? loserSets : winnerSets,
          won ? winnerPoints : loserPoints,
          won ? loserPoints : winnerPoints,
        );
      }
      if (p.teamId) {
        await upsertTeam(
          p.teamId,
          won,
          won ? winnerSets : loserSets,
          won ? loserSets : winnerSets,
        );
      }
    }
  }

  const stats = await prisma.playerStatistics.findMany();
  const teamStats = await prisma.teamStatistics.findMany({ where: { matchesPlayed: { gt: 0 } } });
  console.log(`Done. player_statistics=${stats.length}, team_statistics(with play)=${teamStats.length}`);
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
