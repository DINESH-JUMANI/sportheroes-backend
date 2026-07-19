import type {
  Match,
  MatchParticipant,
  MatchPoint,
  MatchSet,
  MatchStatusLog,
  User,
  Team,
} from '@prisma/client';
import { parseMatchFormat, currentServer } from '../../utils/match-format';

export interface PublicMatchParticipant {
  id: string;
  side: string;
  userId: string | null;
  teamId: string | null;
  isWinner: boolean;
  user?: { id: string; fullName: string; displayName: string | null };
  team?: {
    id: string;
    name: string;
    captain?: { id: string; fullName: string; displayName: string | null } | null;
  };
}

export interface PublicMatchSet {
  id: string;
  setNumber: number;
  sideAScore: number;
  sideBScore: number;
  winnerSide: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface PublicMatchPoint {
  id: string;
  pointNumber: number;
  scoringSide: string;
  sideAScoreAfter: number;
  sideBScoreAfter: number;
  isUndone: boolean;
  recordedBy: string;
  recordedAt: string;
  pointType?: string;
  serverSide?: string | null;
}

export interface PublicMatch {
  id: string;
  sportId: string;
  tournamentId: string | null;
  tournamentRoundId: string | null;
  matchType: string;
  matchFormat: Record<string, unknown>;
  venue: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  winnerSide: string | null;
  createdBy: string;
  participants?: PublicMatchParticipant[];
  sets?: PublicMatchSet[];
  createdAt: string;
  updatedAt: string;
  currentServer?: 'A' | 'B' | null;
  isDeuce?: boolean | null;
}

type MatchWithRelations = Match & {
  participants?: (MatchParticipant & { user?: User | null; team?: (Team & { captain?: User | null }) | null })[];
  sets?: MatchSet[];
  points?: MatchPoint[];
  statusLogs?: MatchStatusLog[];
};

export function toPublicMatchParticipant(
  p: MatchParticipant & { user?: User | null; team?: (Team & { captain?: User | null }) | null },
): PublicMatchParticipant {
  return {
    id: p.id,
    side: p.side,
    userId: p.userId,
    teamId: p.teamId,
    isWinner: p.isWinner,
    user: p.user
      ? { id: p.user.id, fullName: p.user.fullName, displayName: p.user.displayName }
      : undefined,
    team: p.team
      ? {
          id: p.team.id,
          name: p.team.name,
          captain: p.team.captain
            ? {
                id: p.team.captain.id,
                fullName: p.team.captain.fullName,
                displayName: p.team.captain.displayName,
              }
            : null,
        }
      : undefined,
  };
}

export function toPublicMatchSet(s: MatchSet): PublicMatchSet {
  return {
    id: s.id,
    setNumber: s.setNumber,
    sideAScore: s.sideAScore,
    sideBScore: s.sideBScore,
    winnerSide: s.winnerSide,
    startedAt: s.startedAt?.toISOString() ?? null,
    endedAt: s.endedAt?.toISOString() ?? null,
  };
}

export function toPublicMatchPoint(p: MatchPoint): PublicMatchPoint {
  return {
    id: p.id,
    pointNumber: p.pointNumber,
    scoringSide: p.scoringSide,
    sideAScoreAfter: p.sideAScoreAfter,
    sideBScoreAfter: p.sideBScoreAfter,
    isUndone: p.isUndone,
    recordedBy: p.recordedBy,
    recordedAt: p.recordedAt.toISOString(),
    pointType: p.pointType,
    serverSide: p.serverSide,
  };
}

export function toPublicMatch(match: MatchWithRelations): PublicMatch {
  let currentServerSide: 'A' | 'B' | null = null;
  let isMatchDeuce = false;

  try {
    const format = parseMatchFormat(match.matchFormat);
    if ((typeof format.serve_switch_interval === 'number' || format.sport_code === 'BAD') && match.status !== 'completed' && match.status !== 'cancelled') {
      let activeSet = match.sets?.find((s) => !s.winnerSide);
      let currentSetNumber = 1;
      let pointsA = 0;
      let pointsB = 0;

      if (activeSet) {
        currentSetNumber = activeSet.setNumber;
        pointsA = activeSet.sideAScore;
        pointsB = activeSet.sideBScore;
      } else if (match.sets && match.sets.length > 0) {
        currentSetNumber = match.sets.length + 1;
      }

      // Check if currentSetNumber is within range
      if (currentSetNumber <= format.best_of_sets) {
        let initialServerOfSet1: 'A' | 'B' = 'A';
        if (match.points && match.points.length > 0) {
          const sortedPoints = [...match.points].sort((a, b) => a.pointNumber - b.pointNumber || a.recordedAt.getTime() - b.recordedAt.getTime());
          const firstPt = sortedPoints[0];
          if (firstPt && firstPt.serverSide) {
            initialServerOfSet1 = firstPt.serverSide as 'A' | 'B';
          }
        } else {
          const customFirst = (format as any).firstServer || (format as any).first_server;
          if (customFirst === 'A' || customFirst === 'B') {
            initialServerOfSet1 = customFirst;
          }
        }

        let lastPointSide: 'A' | 'B' | null = null;
        if (format.sport_code === 'BAD' && activeSet && match.points && match.points.length > 0) {
          const activeSetPoints = match.points
            .filter((p) => p.matchSetId === activeSet.id)
            .sort((a, b) => a.pointNumber - b.pointNumber || a.recordedAt.getTime() - b.recordedAt.getTime());
          if (activeSetPoints.length > 0) {
            const nonLetPoints = activeSetPoints.filter(p => p.pointType !== 'let');
            if (nonLetPoints.length > 0) {
              lastPointSide = nonLetPoints[nonLetPoints.length - 1].scoringSide as 'A' | 'B';
            }
          }
        }

        let initialServerOfCurrentSet: 'A' | 'B' = 'A';
        if (format.sport_code === 'BAD') {
          if (currentSetNumber === 1) {
            initialServerOfCurrentSet = initialServerOfSet1;
          } else {
            const prevSet = match.sets?.find((s) => s.setNumber === currentSetNumber - 1);
            initialServerOfCurrentSet = (prevSet?.winnerSide as 'A' | 'B') || initialServerOfSet1;
          }
        } else {
          initialServerOfCurrentSet = currentSetNumber % 2 === 1 ? initialServerOfSet1 : (initialServerOfSet1 === 'A' ? 'B' : 'A');
        }

        currentServerSide = currentServer(pointsA, pointsB, initialServerOfCurrentSet, format, lastPointSide);

        const deuceThreshold = format.points_per_set - 1;
        const deuceEnabled = format.deuce_enabled !== false;
        isMatchDeuce = deuceEnabled && pointsA >= deuceThreshold && pointsB >= deuceThreshold;
      }
    }
  } catch (e) {
    // Ignore formatting errors for matches of other formats
  }

  return {
    id: match.id,
    sportId: match.sportId,
    tournamentId: match.tournamentId,
    tournamentRoundId: match.tournamentRoundId,
    matchType: match.matchType,
    matchFormat: match.matchFormat as Record<string, unknown>,
    venue: match.venue,
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    startedAt: match.startedAt?.toISOString() ?? null,
    finishedAt: match.finishedAt?.toISOString() ?? null,
    status: match.status,
    winnerSide: match.winnerSide,
    createdBy: match.createdBy,
    participants: match.participants?.map(toPublicMatchParticipant),
    sets: match.sets?.map(toPublicMatchSet),
    currentServer: currentServerSide,
    isDeuce: isMatchDeuce,
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  };
}
