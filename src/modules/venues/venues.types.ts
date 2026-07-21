import type { Venue } from '@prisma/client';

export interface PublicVenue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPublicVenue(venue: Venue): PublicVenue {
  return {
    id: venue.id,
    name: venue.name,
    latitude: venue.latitude,
    longitude: venue.longitude,
    address: venue.address,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    createdBy: venue.createdBy,
    isActive: venue.isActive,
    createdAt: venue.createdAt.toISOString(),
    updatedAt: venue.updatedAt.toISOString(),
  };
}
