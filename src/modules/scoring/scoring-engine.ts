import { SportConfig } from '../sports/table-tennis.config';

export interface SetScore {
  player1Score: number;
  player2Score: number;
}

export interface MatchState {
  matchId: string;
  sportKey: string;
  status: 'scheduled' | 'live' | 'completed';
  currentSetIndex: number; // 0-indexed
  sets: SetScore[];
  setWins: {
    player1: number;
    player2: number;
  };
  winnerId: string | null;
}

export interface ScoreEvent {
  id: string;
  matchId: string;
  playerId: string; // The player who triggered the event
  eventType: string; // 'point_won', 'ace', 'error', etc.
  timestamp: Date;
  value?: number;
}

/**
 * Handles incoming scoring events and updates the match state based on sport configuration.
 * Adheres to Event-Driven Scoring: "Never update score directly. Instead, every action becomes an Event."
 */
export function processScoreEvent(
  currentState: MatchState,
  event: ScoreEvent,
  config: SportConfig
): MatchState {
  if (currentState.status !== 'live') {
    throw new Error('Cannot update score for a match that is not currently live');
  }

  // Deep clone state to avoid side effects
  const nextState: MatchState = JSON.parse(JSON.stringify(currentState));
  
  // Make sure we have current set initialized
  if (!nextState.sets[nextState.currentSetIndex]) {
    nextState.sets[nextState.currentSetIndex] = { player1Score: 0, player2Score: 0 };
  }

  const currentSet = nextState.sets[nextState.currentSetIndex];

  // For Table Tennis, identify player index (simplifying for mock logic)
  const isPlayer1 = event.playerId === 'player1';

  // Apply scoring action
  if (event.eventType === 'point_won' || event.eventType === 'ace' || event.eventType === 'rally_won') {
    if (isPlayer1) {
      currentSet.player1Score += 1;
    } else {
      currentSet.player2Score += 1;
    }
  } else if (event.eventType === 'error' || event.eventType === 'serve_error') {
    // Error by player means point to opponent
    if (isPlayer1) {
      currentSet.player2Score += 1;
    } else {
      currentSet.player1Score += 1;
    }
  }

  // Check if current set is won
  const rule = config.scoringRules;
  const p1 = currentSet.player1Score;
  const p2 = currentSet.player2Score;

  const reachedMinPoints = p1 >= rule.pointsToWinSet || p2 >= rule.pointsToWinSet;
  const differenceSatisfied = Math.abs(p1 - p2) >= rule.differenceToWinSet;

  if (reachedMinPoints && differenceSatisfied) {
    // Current set is finished!
    if (p1 > p2) {
      nextState.setWins.player1 += 1;
    } else {
      nextState.setWins.player2 += 1;
    }

    // Check if match is finished (best of N)
    const setsToWin = Math.ceil(rule.bestOfSets / 2);
    if (nextState.setWins.player1 >= setsToWin) {
      nextState.winnerId = 'player1';
      nextState.status = 'completed';
    } else if (nextState.setWins.player2 >= setsToWin) {
      nextState.winnerId = 'player2';
      nextState.status = 'completed';
    } else {
      // Advance to next set
      nextState.currentSetIndex += 1;
      nextState.sets.push({ player1Score: 0, player2Score: 0 });
    }
  }

  return nextState;
}
