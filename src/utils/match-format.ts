export interface MatchFormat {
  sets_to_win: number;
  best_of_sets: number;
  points_per_set: number;
  win_by_margin: number;
  deuce_enabled?: boolean;
  deciding_set_points?: number;
  serve_switch_interval?: number;
  deuce_serve_switch_interval?: number;
  sport_code?: string;
}

export function parseMatchFormat(value: unknown): MatchFormat {
  const format = value as MatchFormat;
  if (
    !format ||
    typeof format.sets_to_win !== 'number' ||
    typeof format.best_of_sets !== 'number' ||
    typeof format.points_per_set !== 'number' ||
    typeof format.win_by_margin !== 'number'
  ) {
    throw new Error('Invalid match format configuration');
  }
  return format;
}

export function isSetWon(
  sideAScore: number,
  sideBScore: number,
  format: MatchFormat,
  setNumber: number,
): 'A' | 'B' | null {
  if (format.sport_code === 'BAD') {
    if (sideAScore >= 30) return 'A';
    if (sideBScore >= 30) return 'B';
  }

  const pointsToWin =
    format.deciding_set_points &&
    setNumber === format.best_of_sets &&
    sideAScore < format.sets_to_win &&
    sideBScore < format.sets_to_win
      ? format.deciding_set_points
      : format.points_per_set;

  const aWins = sideAScore >= pointsToWin && sideAScore - sideBScore >= format.win_by_margin;
  const bWins = sideBScore >= pointsToWin && sideBScore - sideAScore >= format.win_by_margin;

  if (aWins) return 'A';
  if (bWins) return 'B';
  return null;
}

export function countSetWins(sets: { winnerSide: string | null }[]): { A: number; B: number } {
  return sets.reduce(
    (acc, set) => {
      if (set.winnerSide === 'A') acc.A += 1;
      if (set.winnerSide === 'B') acc.B += 1;
      return acc;
    },
    { A: 0, B: 0 },
  );
}

export function getMatchWinnerSide(
  sets: { winnerSide: string | null }[],
  format: MatchFormat,
): 'A' | 'B' | null {
  const wins = countSetWins(sets);
  if (wins.A >= format.sets_to_win) return 'A';
  if (wins.B >= format.sets_to_win) return 'B';
  return null;
}

export function currentServer(
  pointsA: number,
  pointsB: number,
  initialServer: 'A' | 'B',
  format: MatchFormat,
  lastPointSide?: 'A' | 'B' | null,
): 'A' | 'B' {
  if (format.sport_code === 'BAD') {
    return lastPointSide || initialServer;
  }

  const serve_switch_interval = format.serve_switch_interval ?? 2;
  const deuce_serve_switch_interval = format.deuce_serve_switch_interval ?? 1;
  const points_per_set = format.points_per_set;

  const deuceThreshold = points_per_set - 1;
  const deuceEnabled = format.deuce_enabled !== false;
  const inDeuce = deuceEnabled && pointsA >= deuceThreshold && pointsB >= deuceThreshold;

  const total = pointsA + pointsB;
  const interval = inDeuce ? deuce_serve_switch_interval : serve_switch_interval;

  // How many full "service turns" have elapsed
  const turnsElapsed = Math.floor(total / interval);
  const otherSide = initialServer === 'A' ? 'B' : 'A';

  return turnsElapsed % 2 === 0 ? initialServer : otherSide;
}
