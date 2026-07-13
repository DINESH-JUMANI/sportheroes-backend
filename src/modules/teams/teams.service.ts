import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type { AddMemberInput, CreateTeamInput, UpdateMemberInput, UpdateTeamInput } from './teams.validators';
import { toPublicTeam, toPublicTeamMember } from './teams.types';

export class TeamsService {
  async create(userId: string, input: CreateTeamInput) {
    const sport = await prisma.sport.findUnique({ where: { id: input.sportId } });
    if (!sport?.isActive) throw new NotFoundError('Sport not found');

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          sportId: input.sportId,
          name: input.name,
          shortName: input.shortName ?? null,
          logoUrl: input.logoUrl ?? null,
          description: input.description ?? null,
          createdBy: userId,
          captainId: userId,
        },
        include: { sport: true },
      });

      await tx.teamMember.create({
        data: { teamId: created.id, userId, role: 'captain' },
      });

      await tx.teamStatistics.create({ data: { teamId: created.id } });

      return created;
    });

    Logger.info('Team created', { teamId: team.id, userId });
    return this.getById(team.id);
  }

  async list(page: number, limit: number, sportId?: string, activeOnly = true) {
    const { skip, take } = getPagination({ page, limit });
    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(sportId ? { sportId } : {}),
    };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { sport: true },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      teams: teams.map(toPublicTeam),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        sport: true,
        members: {
          where: { isActive: true },
          include: { user: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');
    return toPublicTeam(team);
  }

  async update(teamId: string, userId: string, input: UpdateTeamInput) {
    await this.assertCanManage(teamId, userId);

    if (input.captainId) await this.assertActiveMember(teamId, input.captainId);
    if (input.viceCaptainId) await this.assertActiveMember(teamId, input.viceCaptainId);

    const team = await prisma.$transaction(async (tx) => {
      const updated = await tx.team.update({
        where: { id: teamId },
        data: input,
        include: { sport: true, members: { where: { isActive: true }, include: { user: true } } },
      });

      if (input.captainId) {
        await tx.teamMember.updateMany({
          where: { teamId, role: 'captain', isActive: true },
          data: { role: 'member' },
        });
        await tx.teamMember.updateMany({
          where: { teamId, userId: input.captainId, isActive: true },
          data: { role: 'captain' },
        });
      }

      if (input.viceCaptainId) {
        await tx.teamMember.updateMany({
          where: { teamId, role: 'vice_captain', isActive: true },
          data: { role: 'member' },
        });
        await tx.teamMember.updateMany({
          where: { teamId, userId: input.viceCaptainId, isActive: true },
          data: { role: 'vice_captain' },
        });
      }

      return updated;
    });

    Logger.info('Team updated', { teamId });
    return toPublicTeam(team);
  }

  async softDelete(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');
    if (team.createdBy !== userId) throw new ForbiddenError('Only the team creator can delete the team');

    await prisma.team.update({ where: { id: teamId }, data: { isActive: false } });
    Logger.info('Team deactivated', { teamId });
  }

  async addMember(teamId: string, actorId: string, input: AddMemberInput) {
    await this.assertCanManage(teamId, actorId);

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user?.isActive) throw new NotFoundError('User not found');

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: input.userId } },
    });

    if (existing?.isActive) throw new BadRequestError('User is already a team member');

    const member = existing
      ? await prisma.teamMember.update({
          where: { id: existing.id },
          data: { isActive: true, role: input.role, leftAt: null, joinedAt: new Date() },
          include: { user: true },
        })
      : await prisma.teamMember.create({
          data: { teamId, userId: input.userId, role: input.role },
          include: { user: true },
        });

    if (input.role === 'captain') {
      await prisma.team.update({ where: { id: teamId }, data: { captainId: input.userId } });
    }
    if (input.role === 'vice_captain') {
      await prisma.team.update({ where: { id: teamId }, data: { viceCaptainId: input.userId } });
    }

    Logger.info('Team member added', { teamId, userId: input.userId });
    return toPublicTeamMember(member);
  }

  async updateMember(teamId: string, memberId: string, actorId: string, input: UpdateMemberInput) {
    await this.assertCanManage(teamId, actorId);

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId, isActive: true },
      include: { user: true },
    });
    if (!member) throw new NotFoundError('Team member not found');

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: input,
      include: { user: true },
    });

    if (input.role === 'captain') {
      await prisma.team.update({ where: { id: teamId }, data: { captainId: member.userId } });
    }
    if (input.role === 'vice_captain') {
      await prisma.team.update({ where: { id: teamId }, data: { viceCaptainId: member.userId } });
    }

    return toPublicTeamMember(updated);
  }

  async removeMember(teamId: string, memberId: string, actorId: string) {
    await this.assertCanManage(teamId, actorId);

    const member = await prisma.teamMember.findFirst({ where: { id: memberId, teamId, isActive: true } });
    if (!member) throw new NotFoundError('Team member not found');

    await prisma.teamMember.update({
      where: { id: memberId },
      data: { isActive: false, leftAt: new Date() },
    });

    Logger.info('Team member removed', { teamId, memberId });
  }

  async listMembers(teamId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId, isActive: true } });
    if (!team) throw new NotFoundError('Team not found');

    const members = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map(toPublicTeamMember);
  }

  private async assertCanManage(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');

    const isCaptain = team.captainId === userId || team.createdBy === userId;
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId, isActive: true, role: { in: ['captain', 'vice_captain'] } },
    });

    if (!isCaptain && !member) {
      throw new ForbiddenError('Only captain or vice-captain can manage this team');
    }
  }

  private async assertActiveMember(teamId: string, userId: string) {
    const member = await prisma.teamMember.findFirst({ where: { teamId, userId, isActive: true } });
    if (!member) throw new BadRequestError('User must be an active team member');
  }
}

export const teamsService = new TeamsService();
