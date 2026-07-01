import { Router, Request, Response } from 'express';
import { TableTennisConfig } from '../sports/table-tennis.config';
import { MatchState, ScoreEvent, processScoreEvent } from '../scoring/scoring-engine';

const router = Router();

// Simple in-memory stores for quick API validation
const matchesStore: Record<string, MatchState> = {};
const eventsStore: Record<string, ScoreEvent[]> = {};

/**
 * @route POST /matches/create
 * Creates a new match structure
 */
router.post('/create', (req: Request, res: Response) => {
  const { matchId } = req.body;
  if (!matchId) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  const initialMatchState: MatchState = {
    matchId,
    sportKey: 'table_tennis',
    status: 'scheduled',
    currentSetIndex: 0,
    sets: [{ player1Score: 0, player2Score: 0 }],
    setWins: { player1: 0, player2: 0 },
    winnerId: null,
  };

  matchesStore[matchId] = initialMatchState;
  eventsStore[matchId] = [];

  return res.status(201).json({
    message: 'Table Tennis match created successfully',
    match: initialMatchState,
  });
});

/**
 * @route POST /matches/start
 * Starts the scoring of a match (sets state to live)
 */
router.post('/start', (req: Request, res: Response) => {
  const { matchId } = req.body;
  const match = matchesStore[matchId];
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  match.status = 'live';
  return res.json({ message: 'Match is now live', match });
});

/**
 * @route POST /matches/event
 * Records a scoring action (Event-Driven Scoring)
 */
router.post('/event', (req: Request, res: Response) => {
  const { matchId, playerId, eventType } = req.body;
  const match = matchesStore[matchId];
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  if (!playerId || !eventType) {
    return res.status(400).json({ error: 'playerId and eventType are required' });
  }

  try {
    const event: ScoreEvent = {
      id: Math.random().toString(36).substring(2, 9),
      matchId,
      playerId,
      eventType,
      timestamp: new Date(),
    };

    // Calculate next state using our configurable scoring engine
    const nextState = processScoreEvent(match, event, TableTennisConfig);
    matchesStore[matchId] = nextState;
    eventsStore[matchId].push(event);

    return res.json({
      message: 'Score event processed',
      event,
      match: nextState,
    });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to process score event',
    });
  }
});

/**
 * @route GET /matches/:matchId
 * Returns current match state and historical events
 */
router.get('/:matchId', (req: Request, res: Response) => {
  const matchId = req.params.matchId;
  const match = matchesStore[matchId];
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  return res.json({
    match,
    events: eventsStore[matchId] || [],
  });
});

export default router;
