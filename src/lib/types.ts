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
  isFavorite?: boolean;
  showActions?: boolean;
  onToggleFavorite?: (movie: MovieCardData) => void;
  onAddToList?: (movie: MovieCardData) => void;
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
