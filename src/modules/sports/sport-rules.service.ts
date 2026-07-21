import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

export interface PublicSportRules {
  sportId: string;
  sportCode: string;
  supportsSingles: boolean;
  supportsDoubles: boolean;
  supportsTeamMatches: boolean;
  usesTeamRoster: boolean;
  hasCaptain: boolean;
  hasViceCaptain: boolean;
  minRosterSize: number | null;
  maxRosterSize: number | null;
  minPlayersPerSide: number;
  maxPlayersPerSide: number;
  matchFormat: unknown;
  scoringConfig: unknown;
}

function mapRules(sportId: string, sportCode: string, rules: {
  supportsSingles: boolean;
  supportsDoubles: boolean;
  supportsTeamMatches: boolean;
  usesTeamRoster: boolean;
  hasCaptain: boolean;
  hasViceCaptain: boolean;
  minRosterSize: number | null;
  maxRosterSize: number | null;
  minPlayersPerSide: number;
  maxPlayersPerSide: number;
  matchFormat: unknown;
  scoringConfig: unknown;
}): PublicSportRules {
  return {
    sportId,
    sportCode,
    supportsSingles: rules.supportsSingles,
    supportsDoubles: rules.supportsDoubles,
    supportsTeamMatches: rules.supportsTeamMatches,
    usesTeamRoster: rules.usesTeamRoster,
    hasCaptain: rules.hasCaptain,
    hasViceCaptain: rules.hasViceCaptain,
    minRosterSize: rules.minRosterSize,
    maxRosterSize: rules.maxRosterSize,
    minPlayersPerSide: rules.minPlayersPerSide,
    maxPlayersPerSide: rules.maxPlayersPerSide,
    matchFormat: rules.matchFormat,
    scoringConfig: rules.scoringConfig,
  };
}

export class SportRulesService {
  async getBySportCode(code: string): Promise<PublicSportRules> {
    const sport = await prisma.sport.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        tableTennisRules: true,
        badmintonRules: true,
        volleyballRules: true,
        pickleballRules: true,
        tennisRules: true,
      },
    });

    if (!sport?.isActive) throw new NotFoundError('Sport not found');

    const c = sport.code;
    if (c === 'TT' && sport.tableTennisRules) {
      return mapRules(sport.id, c, sport.tableTennisRules);
    }
    if (c === 'BAD' && sport.badmintonRules) {
      return mapRules(sport.id, c, sport.badmintonRules);
    }
    if (c === 'VB' && sport.volleyballRules) {
      return mapRules(sport.id, c, sport.volleyballRules);
    }
    if (c === 'PBL' && sport.pickleballRules) {
      return mapRules(sport.id, c, sport.pickleballRules);
    }
    if (c === 'TEN' && sport.tennisRules) {
      return mapRules(sport.id, c, sport.tennisRules);
    }

    throw new NotFoundError('Sport-specific rules not configured');
  }
}

export const sportRulesService = new SportRulesService();
