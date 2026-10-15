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
}

export interface RecommendationResponse {
  recommendations: MovieRecommendation[];
}

export interface MovieMatch {
  id: number;
  content: string;
  similarity: number;
}

export interface TmdbMovie {
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
}

export interface TmdbSearchResponse {
  results?: TmdbMovie[];
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
  movie: MovieRecommendation;
  index: number;
}

export interface ResultsProps {
  status: RecommendationStatus;
  recommendations: MovieRecommendation[];
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
