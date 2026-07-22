import type { TeamMember, TeamRoleType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { Logger } from '../../utils/logger';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import { findOrCreateUserByPhone, findUserByPhone } from '../../utils/user-resolver';
import type {
  AddMemberInput,
  CreateTeamInput,
  UpdateMemberInput,
  UpdateTeamInput,
} from './teams.validators';
import { toPublicTeam, toPublicTeamMember, type PublicUserLookup } from './teams.types';
import { extensionForMime, uploadToSupabase } from '../../utils/storage';

const teamInclude = {
  members: {
    where: { isActive: true },
    include: { user: true },
    orderBy: { joinedAt: 'asc' as const },
  },
};

export class TeamsService {
  async create(userId: string, input: CreateTeamInput) {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: input.name,
          shortName: input.shortName ?? null,
          description: input.description ?? null,
          createdBy: userId,
        },
      });

      await tx.teamMember.create({
        data: { teamId: created.id, userId, role: 'admin' },
      });

      await tx.teamStatistics.create({ data: { teamId: created.id } });

      return created;
    });

    Logger.info('Team created', { teamId: team.id, userId });
    return this.getById(team.id);
  }

  async list(page: number, limit: number, activeOnly = true) {
    const { skip, take } = getPagination({ page, limit });
    const where = activeOnly ? { isActive: true } : {};

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
      include: teamInclude,
    });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');
    return toPublicTeam(team);
  }

  async update(teamId: string, userId: string, input: UpdateTeamInput) {
    await this.assertIsAdmin(teamId, userId);

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.shortName !== undefined) data.shortName = input.shortName;
    if (input.description !== undefined) data.description = input.description;
    if (input.logoUrl !== undefined) {
      data.logoUrl = input.logoUrl;
      if (input.logoUrl === null) {
        data.logoBlob = null;
        data.logoMimeType = null;
      }
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data,
      include: teamInclude,
    });

    Logger.info('Team updated', { teamId });
    return toPublicTeam(team);
  }

  /** Upload logo file to Supabase Storage and store public URL. */
  async uploadLogo(teamId: string, userId: string, file: Express.Multer.File) {
    await this.assertIsAdmin(teamId, userId);

    const path = `teams/${teamId}/logo.${extensionForMime(file.mimetype)}`;
    const logoUrl = await uploadToSupabase({
      bucket: 'team-logos',
      path,
      buffer: file.buffer,
      contentType: file.mimetype,
      upsert: true,
    });

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        logoUrl,
        logoMimeType: file.mimetype,
        logoBlob: null,
      },
      include: teamInclude,
    });

    Logger.info('Team logo uploaded to Supabase', { teamId });
    return toPublicTeam(team);
  }

  async getLogo(teamId: string): Promise<
    { redirectUrl: string } | { buffer: Buffer; mimeType: string }
  > {
    const team = await prisma.team.findUnique({
      where: { id: teamId, isActive: true },
      select: { logoUrl: true, logoBlob: true, logoMimeType: true },
    });
    if (!team) throw new NotFoundError('Team not found');

    if (team.logoUrl) {
      return { redirectUrl: team.logoUrl };
    }
    if (!team.logoBlob || !team.logoMimeType) throw new NotFoundError('Team has no logo');

    return { buffer: Buffer.from(team.logoBlob), mimeType: team.logoMimeType };
  }

  async softDelete(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');

    const membership = await this.getActiveMembership(teamId, userId);
    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenError('Only team admins can delete the team');
    }

    await prisma.team.update({ where: { id: teamId }, data: { isActive: false } });
    Logger.info('Team deactivated', { teamId });
  }

  async lookupUserByPhone(phoneNumber: string): Promise<PublicUserLookup> {
    const user = await findUserByPhone(phoneNumber);
    if (!user) return { found: false };

    return {
      found: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber!,
        profilePictureUrl: user.profilePictureUrl,
      },
    };
  }

  async addMember(teamId: string, actorId: string, input: AddMemberInput) {
    await this.assertCanManageRoster(teamId, actorId);

    const actorMembership = await this.getActiveMembership(teamId, actorId);
    if (actorMembership?.role === 'captain' && input.role !== 'member') {
      throw new ForbiddenError('Captains can only add members with the member role');
    }

    const user = await findOrCreateUserByPhone({
      phoneNumber: input.phoneNumber,
      fullName: input.fullName,
    });

    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: user.id } },
    });

    if (existing?.isActive) throw new BadRequestError('User is already a team member');

    const member = await prisma.$transaction(async (tx) => {
      if (input.role === 'captain' || input.role === 'vice_captain') {
        await this.demoteRoleHolder(tx, teamId, input.role);
      }

      const created = existing
        ? await tx.teamMember.update({
            where: { id: existing.id },
            data: { isActive: true, role: input.role, leftAt: null, joinedAt: new Date() },
            include: { user: true },
          })
        : await tx.teamMember.create({
            data: { teamId, userId: user.id, role: input.role },
            include: { user: true },
          });

      await this.syncTeamLeadership(tx, teamId, user.id, input.role);
      return created;
    });

    Logger.info('Team member added', { teamId, userId: user.id, role: input.role });
    return toPublicTeamMember(member);
  }

  async updateMember(teamId: string, memberId: string, actorId: string, input: UpdateMemberInput) {
    await this.assertIsAdmin(teamId, actorId);

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId, isActive: true },
      include: { user: true },
    });
    if (!member) throw new NotFoundError('Team member not found');

    if (input.role) {
      const adminCount = await prisma.teamMember.count({
        where: { teamId, role: 'admin', isActive: true },
      });
      if (member.role === 'admin' && input.role !== 'admin' && adminCount <= 1) {
        throw new BadRequestError('Team must have at least one admin');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.role && input.role !== member.role) {
        if (input.role === 'captain' || input.role === 'vice_captain') {
          await this.demoteRoleHolder(tx, teamId, input.role, member.id);
        }
      }

      const result = await tx.teamMember.update({
        where: { id: memberId },
        data: input,
        include: { user: true },
      });

      if (input.role) {
        await this.syncTeamLeadership(tx, teamId, member.userId, input.role);
        if (input.role !== 'captain' && member.role === 'captain') {
          await tx.team.update({ where: { id: teamId }, data: { captainId: null } });
        }
        if (input.role !== 'vice_captain' && member.role === 'vice_captain') {
          await tx.team.update({ where: { id: teamId }, data: { viceCaptainId: null } });
        }
      }

      return result;
    });

    return toPublicTeamMember(updated);
  }

  async removeMember(teamId: string, memberId: string, actorId: string) {
    await this.assertCanManageRoster(teamId, actorId);

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId, isActive: true },
    });
    if (!member) throw new NotFoundError('Team member not found');

    if (member.role === 'admin') {
      const adminCount = await prisma.teamMember.count({
        where: { teamId, role: 'admin', isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestError('Cannot remove the last admin from the team');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: memberId },
        data: { isActive: false, leftAt: new Date() },
      });

      if (member.role === 'captain') {
        await tx.team.update({ where: { id: teamId }, data: { captainId: null } });
      }
      if (member.role === 'vice_captain') {
        await tx.team.update({ where: { id: teamId }, data: { viceCaptainId: null } });
      }
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

  private async getActiveMembership(teamId: string, userId: string): Promise<TeamMember | null> {
    return prisma.teamMember.findFirst({
      where: { teamId, userId, isActive: true },
    });
  }

  private async assertIsAdmin(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');

    const membership = await this.getActiveMembership(teamId, userId);
    if (!membership || membership.role !== 'admin') {
      throw new ForbiddenError('Only team admins can perform this action');
    }
  }

  private async assertCanManageRoster(teamId: string, userId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || !team.isActive) throw new NotFoundError('Team not found');

    const membership = await this.getActiveMembership(teamId, userId);
    if (!membership || !['admin', 'captain'].includes(membership.role)) {
      throw new ForbiddenError('Only team admins or captains can manage roster');
    }
  }

  private async demoteRoleHolder(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    teamId: string,
    role: TeamRoleType,
    excludeMemberId?: string,
  ) {
    if (!['captain', 'vice_captain'].includes(role)) return;

    const holders = await tx.teamMember.findMany({
      where: {
        teamId,
        role,
        isActive: true,
        ...(excludeMemberId ? { NOT: { id: excludeMemberId } } : {}),
      },
    });

    for (const holder of holders) {
      await tx.teamMember.update({
        where: { id: holder.id },
        data: { role: 'member' },
      });
    }

    if (role === 'captain') {
      await tx.team.update({ where: { id: teamId }, data: { captainId: null } });
    }
    if (role === 'vice_captain') {
      await tx.team.update({ where: { id: teamId }, data: { viceCaptainId: null } });
    }
  }

  private async syncTeamLeadership(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    teamId: string,
    userId: string,
    role: TeamRoleType,
  ) {
    if (role === 'captain') {
      await tx.team.update({ where: { id: teamId }, data: { captainId: userId } });
    }
    if (role === 'vice_captain') {
      await tx.team.update({ where: { id: teamId }, data: { viceCaptainId: userId } });
    }
  }
}

export const teamsService = new TeamsService();
