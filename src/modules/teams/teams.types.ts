import type { Team, TeamMember, User, Sport } from '@prisma/client';

export interface PublicTeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  user?: {
    id: string;
    fullName: string;
    displayName: string | null;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
  };
}

export interface PublicTeam {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  hasLogo: boolean;
  logoMimeType: string | null;
  description: string | null;
  captainId: string | null;
  viceCaptainId: string | null;
  createdBy: string;
  isActive: boolean;
  members?: PublicTeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserLookup {
  found: boolean;
  user?: {
    id: string;
    fullName: string;
    displayName: string | null;
    phoneNumber: string;
    profilePictureUrl: string | null;
  };
}

type TeamWithRelations = Team & {
  sport?: Sport | null;
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
          phoneNumber: member.user.phoneNumber,
          profilePictureUrl: member.user.profilePictureUrl,
        }
      : undefined,
  };
}

export function toPublicTeam(team: TeamWithRelations): PublicTeam {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    logoUrl: team.logoUrl,
    hasLogo: Boolean(team.logoUrl) || (!!team.logoBlob && team.logoBlob.length > 0),
    logoMimeType: team.logoMimeType,
    description: team.description,
    captainId: team.captainId,
    viceCaptainId: team.viceCaptainId,
    createdBy: team.createdBy,
    isActive: team.isActive,
    members: team.members?.map(toPublicTeamMember),
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export function decodeLogoBase64(base64: string): Uint8Array {
  const data = base64.includes(',') ? base64.split(',')[1]! : base64;
  return new Uint8Array(Buffer.from(data, 'base64'));
}
