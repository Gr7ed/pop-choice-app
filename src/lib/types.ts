export interface Preferences {
  favoriteMovie: string;
  mood: string;
  favoriteGenre: string;
}

export interface MovieRecommendation {
  title: string;
  releaseYear: string;
  content: string;
  posterUrl?: string | null;
  tmdbId?: number;
  voteAverage?: number | null;
}

export interface MovieCardData {
  title: string;
  releaseYear: string | number | null;
  posterUrl?: string | null;
  content?: string | null;
  overview?: string | null;
  tmdbId?: number;
  voteAverage?: number | null;
}

export interface TmdbCard extends MovieCardData {
  tmdbId: number;
  releaseYear: number | null;
  voteAverage: number;
}

export interface LibraryMovie {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string;
  voteAverage: number | null;
  overview: string | null;
}

export interface ListSummary {
  id: string;
  name: string;
  items: LibraryMovie[];
}

export interface DiscoverPayload {
  trending: TmdbCard[];
  topRated: TmdbCard[];
  nowPlaying: TmdbCard[];
}

/** A page of TMDB results plus the pagination metadata the proxy forwards. */
export interface MoviePage {
  page: number;
  results: TmdbCard[];
  totalPages: number;
  totalResults: number;
}

/**
 * Filters the browse page sends to `/api/movies/discover`. Values use TMDB's
 * own query names and are applied to the proxy unchanged.
 */
export interface MovieFilters {
  sortBy: string;
  /** Single genre id, or `1,2` (AND) / `1|2` (OR) for multiple. */
  genre: string;
  /** Primary release year, as a string because it comes from a select control. */
  year: string;
  /** Minimum `vote_average`, 0–10. */
  minRating: string;
  /** ISO 639-1 original language code. */
  language: string;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}


export interface RecommendationResponse {
  recommendations: MovieRecommendation[];
}

export type RecommendationStatus = 'idle' | 'loading' | 'success' | 'error';

export type RecommendFunction = (preferences: Preferences) => Promise<MovieRecommendation[]>;

export interface AppProps {
  recommend?: RecommendFunction;
}

export interface PreferenceFormProps {
  onSubmit: (preferences: Preferences) => void;
  isLoading: boolean;
}

export interface MovieCardProps {
  movie: MovieCardData;
  index?: number;
  /** Heading level for the title, so cards slot into any section outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  isFavorite?: boolean;
  showActions?: boolean;
  onToggleFavorite?: (movie: MovieCardData) => void;
  onAddToList?: (movie: MovieCardData) => void;
  /** Optional destructive action, e.g. removing a movie from a saved list. */
  onRemove?: (movie: MovieCardData) => void;
  /** Label for the `onRemove` button. Defaults to "Remove". */
  removeLabel?: string;
}

export interface ResultsProps {
  status: RecommendationStatus;
  recommendations: MovieCardData[];
  error: string;
}

export interface WebSearchArguments {
  query: string;
}

export interface ImportMetaEnv {
  readonly VITE_CORS_ORIGIN?: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
