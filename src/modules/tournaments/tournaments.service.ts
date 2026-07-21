import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { normalizePhoneNumber } from '../../utils/phone';
import { resolveUserIdByPhone } from '../../utils/user-resolver';
import type {
  CreateRoundInput,
  CreateTournamentInput,
  RegisterParticipantInput,
  UpdateParticipantInput,
  UpdateTournamentInput,
} from './tournaments.validators';
import {
  toPublicParticipant,
  toPublicRound,
  toPublicStanding,
  toPublicTournament,
} from './tournaments.types';

function toDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export class TournamentsService {
  async create(organizerId: string, input: CreateTournamentInput) {
    const sport = await prisma.sport.findUnique({ where: { id: input.sportId } });
    if (!sport?.isActive) throw new NotFoundError('Sport not found');

    const tournament = await prisma.tournament.create({
      data: {
        sportId: input.sportId,
        organizerId,
        name: input.name,
        format: input.format,
        participantKind: input.participantKind,
        bannerUrl: input.bannerUrl ?? null,
        description: input.description ?? null,
        venue: input.venue ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? null,
        registrationStartDate: toDate(input.registrationStartDate),
        registrationEndDate: toDate(input.registrationEndDate),
        startDate: new Date(input.startDate),
        endDate: toDate(input.endDate),
        maxParticipants: input.maxParticipants ?? null,
      },
    });

    Logger.info('Tournament created', { tournamentId: tournament.id });
    return toPublicTournament(tournament);
  }

  async list(page: number, limit: number, sportId?: string, status?: string) {
    const { skip, take } = getPagination({ page, limit });
    const where = {
      ...(sportId ? { sportId } : {}),
      ...(status ? { status: status as never } : {}),
    };

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({ where, skip, take, orderBy: { startDate: 'desc' } }),
      prisma.tournament.count({ where }),
    ]);

    return {
      tournaments: tournaments.map(toPublicTournament),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundError('Tournament not found');
    return toPublicTournament(tournament);
  }

  async update(tournamentId: string, userId: string, input: UpdateTournamentInput) {
    await this.assertOrganizer(tournamentId, userId);

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        ...input,
        registrationStartDate:
          input.registrationStartDate !== undefined
            ? toDate(input.registrationStartDate)
            : undefined,
        registrationEndDate:
          input.registrationEndDate !== undefined ? toDate(input.registrationEndDate) : undefined,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate !== undefined ? toDate(input.endDate) : undefined,
      },
    });

    return toPublicTournament(tournament);
  }

  async updateStatus(tournamentId: string, userId: string, status: string) {
    await this.assertOrganizer(tournamentId, userId);
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: status as never },
    });
    Logger.info('Tournament status updated', { tournamentId, status });
    return toPublicTournament(tournament);
  }

  async registerParticipant(
    tournamentId: string,
    actorId: string,
    input: RegisterParticipantInput,
  ) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament not found');

    if (!['draft', 'registration_open'].includes(tournament.status)) {
      throw new BadRequestError('Registration is not open for this tournament');
    }

    if (tournament.participantKind === 'individual' && !input.phoneNumber) {
      throw new BadRequestError('This tournament requires individual registration (phoneNumber)');
    }
    if (tournament.participantKind === 'team' && !input.teamId) {
      throw new BadRequestError('This tournament requires team registration (teamId)');
    }

    const count = await prisma.tournamentParticipant.count({ where: { tournamentId } });
    if (tournament.maxParticipants && count >= tournament.maxParticipants) {
      throw new BadRequestError('Tournament is full');
    }

    let resolvedUserId: string | null = null;
    if (input.phoneNumber) {
      resolvedUserId = await resolveUserIdByPhone(
        normalizePhoneNumber(input.phoneNumber),
        input.fullName,
      );
    }

    const participant = await prisma.$transaction(async (tx) => {
      const created = await tx.tournamentParticipant.create({
        data: {
          tournamentId,
          userId: resolvedUserId,
          teamId: input.teamId ?? null,
          seedNumber: input.seedNumber ?? null,
        },
      });

      await tx.tournamentStanding.create({
        data: {
          tournamentId,
          userId: resolvedUserId,
          teamId: input.teamId ?? null,
        },
      });

      return created;
    });

    Logger.info('Tournament participant registered', { tournamentId, participantId: participant.id });
    return toPublicParticipant(participant);
  }

  async listParticipants(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament not found');

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: [{ seedNumber: 'asc' }, { registeredAt: 'asc' }],
    });

    return participants.map(toPublicParticipant);
  }

  async updateParticipant(
    tournamentId: string,
    participantId: string,
    userId: string,
    input: UpdateParticipantInput,
  ) {
    await this.assertOrganizer(tournamentId, userId);

    const participant = await prisma.tournamentParticipant.findFirst({
      where: { id: participantId, tournamentId },
    });
    if (!participant) throw new NotFoundError('Participant not found');

    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: input,
    });

    return toPublicParticipant(updated);
  }

  async createRound(tournamentId: string, userId: string, input: CreateRoundInput) {
    await this.assertOrganizer(tournamentId, userId);

    const round = await prisma.tournamentRound.create({
      data: { tournamentId, roundNumber: input.roundNumber, roundName: input.roundName },
    });

    return toPublicRound(round);
  }

  async listRounds(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament not found');

    const rounds = await prisma.tournamentRound.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: 'asc' },
    });

    return rounds.map(toPublicRound);
  }

  async getStandings(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament not found');

    const standings = await prisma.tournamentStanding.findMany({
      where: { tournamentId },
      orderBy: [{ position: 'asc' }, { points: 'desc' }],
    });

    return standings.map(toPublicStanding);
  }

  private async assertOrganizer(tournamentId: string, userId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament not found');
    if (tournament.organizerId !== userId) {
      throw new ForbiddenError('Only the tournament organizer can perform this action');
    }
  }
}

export const tournamentsService = new TournamentsService();
