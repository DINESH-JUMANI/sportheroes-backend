import type { Tournament, TournamentParticipant, TournamentRound, TournamentStanding } from '@prisma/client';

export interface PublicTournament {
  id: string;
  sportId: string;
  organizerId: string;
  name: string;
  format: string;
  participantKind: string;
  bannerUrl: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string | null;
  teamId: string | null;
  seedNumber: number | null;
  status: string;
  registeredAt: string;
}

export interface PublicTournamentRound {
  id: string;
  tournamentId: string;
  roundNumber: number;
  roundName: string;
  createdAt: string;
}

export interface PublicTournamentStanding {
  id: string;
  tournamentId: string;
  userId: string | null;
  teamId: string | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  position: number | null;
  updatedAt: string;
}

function formatDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function toPublicTournament(t: Tournament): PublicTournament {
  return {
    id: t.id,
    sportId: t.sportId,
    organizerId: t.organizerId,
    name: t.name,
    format: t.format,
    participantKind: t.participantKind,
    bannerUrl: t.bannerUrl,
    description: t.description,
    venue: t.venue,
    city: t.city,
    state: t.state,
    country: t.country,
    registrationStartDate: formatDate(t.registrationStartDate),
    registrationEndDate: formatDate(t.registrationEndDate),
    startDate: formatDate(t.startDate)!,
    endDate: formatDate(t.endDate),
    maxParticipants: t.maxParticipants,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function toPublicParticipant(p: TournamentParticipant): PublicTournamentParticipant {
  return {
    id: p.id,
    tournamentId: p.tournamentId,
    userId: p.userId,
    teamId: p.teamId,
    seedNumber: p.seedNumber,
    status: p.status,
    registeredAt: p.registeredAt.toISOString(),
  };
}

export function toPublicRound(r: TournamentRound): PublicTournamentRound {
  return {
    id: r.id,
    tournamentId: r.tournamentId,
    roundNumber: r.roundNumber,
    roundName: r.roundName,
    createdAt: r.createdAt.toISOString(),
  };
}

export function toPublicStanding(s: TournamentStanding): PublicTournamentStanding {
  return {
    id: s.id,
    tournamentId: s.tournamentId,
    userId: s.userId,
    teamId: s.teamId,
    matchesPlayed: s.matchesPlayed,
    wins: s.wins,
    losses: s.losses,
    points: s.points,
    position: s.position,
    updatedAt: s.updatedAt.toISOString(),
  };
}
