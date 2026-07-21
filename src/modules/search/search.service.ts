import { prisma } from '../../config/prisma';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type { SearchQuery } from './search.validators';
import type { SearchResponse, SearchResultItem } from './search.types';

export class SearchService {
  async search(query: SearchQuery): Promise<SearchResponse> {
    const { q, types, page, limit } = query;
    const typeSet = new Set(types);

    const buckets: SearchResultItem[] = [];

    const tasks: Promise<void>[] = [];

    if (typeSet.has('users')) {
      tasks.push(
        prisma.user
          .findMany({
            where: {
              isActive: true,
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
                { phoneNumber: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 50,
            orderBy: { fullName: 'asc' },
          })
          .then((users) => {
            for (const u of users) {
              buckets.push({
                type: 'user',
                id: u.id,
                title: u.fullName,
                subtitle: u.phoneNumber,
                meta: {
                  displayName: u.displayName,
                  city: u.city,
                  email: u.email,
                },
              });
            }
          }),
      );
    }

    if (typeSet.has('teams')) {
      tasks.push(
        prisma.team
          .findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { shortName: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 50,
            orderBy: { name: 'asc' },
          })
          .then((teams) => {
            for (const t of teams) {
              buckets.push({
                type: 'team',
                id: t.id,
                title: t.name,
                subtitle: t.shortName,
                meta: {
                  shortName: t.shortName,
                },
              });
            }
          }),
      );
    }

    if (typeSet.has('tournaments')) {
      tasks.push(
        prisma.tournament
          .findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { venue: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            include: { sport: true },
            take: 50,
            orderBy: { name: 'asc' },
          })
          .then((tournaments) => {
            for (const t of tournaments) {
              buckets.push({
                type: 'tournament',
                id: t.id,
                title: t.name,
                subtitle: t.venue,
                meta: {
                  sportCode: t.sport?.code ?? null,
                  city: t.city,
                  status: t.status,
                },
              });
            }
          }),
      );
    }

    if (typeSet.has('matches')) {
      tasks.push(
        prisma.match
          .findMany({
            where: {
              venue: { contains: q, mode: 'insensitive' },
            },
            include: { sport: true },
            take: 50,
            orderBy: { createdAt: 'desc' },
          })
          .then((matches) => {
            for (const m of matches) {
              buckets.push({
                type: 'match',
                id: m.id,
                title: `${m.sport?.name ?? 'Match'} — ${m.matchType}`,
                subtitle: m.venue,
                meta: {
                  sportCode: m.sport?.code ?? null,
                  status: m.status,
                  scheduledAt: m.scheduledAt?.toISOString() ?? null,
                },
              });
            }
          }),
      );
    }

    if (typeSet.has('venues')) {
      tasks.push(
        prisma.venue
          .findMany({
            where: {
              isActive: true,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
                { country: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 50,
            orderBy: { name: 'asc' },
          })
          .then((venues) => {
            for (const v of venues) {
              buckets.push({
                type: 'venue',
                id: v.id,
                title: v.name,
                subtitle: [v.city, v.state].filter(Boolean).join(', ') || v.address,
                meta: {
                  latitude: String(v.latitude),
                  longitude: String(v.longitude),
                  city: v.city,
                  address: v.address,
                },
              });
            }
          }),
      );
    }

    await Promise.all(tasks);

    buckets.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    const total = buckets.length;
    const { skip, take } = getPagination({ page, limit });
    const results = buckets.slice(skip, skip + take);

    return {
      results,
      meta: {
        ...buildPaginationMeta(page, limit, total),
        query: q,
        types: [...typeSet],
      },
    };
  }
}

export const searchService = new SearchService();
