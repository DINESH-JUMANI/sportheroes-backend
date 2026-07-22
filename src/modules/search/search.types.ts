export interface SearchResultItem {
  type: 'user' | 'team' | 'tournament' | 'match' | 'venue';
  id: string;
  title: string;
  subtitle: string | null;
  meta: Record<string, string | null>;
}

export interface SearchResponse {
  results: SearchResultItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    query: string;
    types: string[];
  };
}

/** Compact user row for participant typeahead (match create, add team member). */
export interface UserSearchItem {
  id: string;
  fullName: string;
  displayName: string | null;
  phoneNumber: string | null;
  email: string | null;
  profilePictureUrl: string | null;
  city: string | null;
}

export interface UserSearchResponse {
  users: UserSearchItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    query: string;
  };
}
