import type { Team, TeamMember, User, Sport } from '@prisma/client';

export interface PublicTeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  user?: { id: string; fullName: string; displayName: string | null; profilePictureUrl: string | null };
}

export interface PublicTeam {
  id: string;
  sportId: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  description: string | null;
  captainId: string | null;
  viceCaptainId: string | null;
  createdBy: string;
  isActive: boolean;
  sport?: { id: string; name: string; code: string };
  members?: PublicTeamMember[];
  createdAt: string;
  updatedAt: string;
}

type TeamWithRelations = Team & {
  sport?: Sport;
  members?: (TeamMember & { user?: User })[];
};

export function toPublicTeamMember(member: TeamMember & { user?: User }): PublicTeamMember {
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    leftAt: member.leftAt?.toISOString() ?? null,
    isActive: member.isActive,
    user: member.user
      ? {
          id: member.user.id,
          fullName: member.user.fullName,
          displayName: member.user.displayName,
          profilePictureUrl: member.user.profilePictureUrl,
        }
      : undefined,
  };
}

export function toPublicTeam(team: TeamWithRelations): PublicTeam {
  return {
    id: team.id,
    sportId: team.sportId,
    name: team.name,
    shortName: team.shortName,
    logoUrl: team.logoUrl,
    description: team.description,
    captainId: team.captainId,
    viceCaptainId: team.viceCaptainId,
    createdBy: team.createdBy,
    isActive: team.isActive,
    sport: team.sport
      ? { id: team.sport.id, name: team.sport.name, code: team.sport.code }
      : undefined,
    members: team.members?.map(toPublicTeamMember),
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}
