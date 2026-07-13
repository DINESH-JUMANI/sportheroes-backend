import type {
  Match,
  MatchParticipant,
  MatchPoint,
  MatchSet,
  MatchStatusLog,
  User,
  Team,
} from '@prisma/client';

export interface PublicMatchParticipant {
  id: string;
  side: string;
  userId: string | null;
  teamId: string | null;
  isWinner: boolean;
  user?: { id: string; fullName: string; displayName: string | null };
  team?: { id: string; name: string };
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
}

type MatchWithRelations = Match & {
  participants?: (MatchParticipant & { user?: User | null; team?: Team | null })[];
  sets?: MatchSet[];
  points?: MatchPoint[];
  statusLogs?: MatchStatusLog[];
};

export function toPublicMatchParticipant(
  p: MatchParticipant & { user?: User | null; team?: Team | null },
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
    team: p.team ? { id: p.team.id, name: p.team.name } : undefined,
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
  };
}

export function toPublicMatch(match: MatchWithRelations): PublicMatch {
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
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  };
}
