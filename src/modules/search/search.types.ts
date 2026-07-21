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
