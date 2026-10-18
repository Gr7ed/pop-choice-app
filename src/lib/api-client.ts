import type {
  DiscoverPayload,
  LibraryMovie,
  ListSummary,
  MovieRecommendation,
  MovieCardData,
  Preferences,
} from './types';

interface RecommendationApiResponse {
  recommendations: MovieRecommendation[];
}

interface ApiError {
  error?: {
    message?: string;
  };
  message?: string;
}

/** Error thrown for a non-OK API response, keeping the status code for callers. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const parseJson = async <T>(response: Response, fallback: string): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallback);
  }
};

const requestJson = (url: string, init?: RequestInit): Promise<Response> =>
  fetch(url, {
    credentials: 'include',
    ...init,
  });

export const getRecommendationsFromApi = async (preferences: Preferences): Promise<MovieRecommendation[]> => {
  const response = await requestJson('/api/recommendations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  const body = await parseJson<RecommendationApiResponse | ApiError>(response, 'Recommendation request failed.');
  if (!response.ok) {
    throw new Error('error' in body ? body.error?.message || 'Recommendation request failed.' : 'Recommendation request failed.');
  }
  if (!('recommendations' in body) || !Array.isArray(body.recommendations)) {
    throw new Error('Recommendation service returned an invalid response.');
  }
  return body.recommendations;
};

export const getDiscover = async (): Promise<DiscoverPayload> => {
  const response = await requestJson('/api/discover');
  if (!response.ok) throw new Error('Discover feed is unavailable right now.');
  return parseJson<DiscoverPayload>(response, 'Discover feed returned an invalid response.');
};

export const getFavoriteMovies = async (): Promise<LibraryMovie[]> => {
  const response = await requestJson('/api/favorites');
  if (!response.ok) return [];
  const body = await parseJson<{ favorites: LibraryMovie[] }>(response, 'Favorites request failed.');
  return body.favorites;
};

export const getFavorites = async (): Promise<number[]> => {
  const movies = await getFavoriteMovies();
  return movies.map((movie) => movie.tmdbId);
};

export const addFavorite = async (movie: MovieCardData): Promise<void> => {
  const response = await requestJson(`/api/favorites/${movie.tmdbId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(movie),
  });
  if (!response.ok && response.status !== 409) {
    throw new Error('Could not save this favorite.');
  }
};

export const removeFavorite = async (tmdbId: number): Promise<void> => {
  const response = await requestJson(`/api/favorites/${tmdbId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error('Could not remove this favorite.');
  }
};

export const getLists = async (): Promise<ListSummary[]> => {
  const response = await requestJson('/api/lists');
  if (!response.ok) return [];
  const body = await parseJson<{ lists: ListSummary[] }>(response, 'Lists request failed.');
  return body.lists;
};

export const createList = async (name: string): Promise<ListSummary> => {
  const response = await requestJson('/api/lists', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Could not create this list.');
  const body = await parseJson<{ list: { id: string; name: string } }>(response, 'List creation failed.');
  return { id: body.list.id, name: body.list.name, items: [] };
};

export const deleteList = async (listId: string): Promise<void> => {
  const response = await requestJson(`/api/lists/${listId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Could not delete this list.');
};

export const addToList = async (listId: string, movie: MovieCardData): Promise<void> => {
  const response = await requestJson(`/api/lists/${listId}/movies`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(movie),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null as ApiError | null);
    const message = body?.error?.message ?? body?.message ?? 'Could not add this movie to the list.';
    throw new ApiRequestError(response.status, message);
  }
};

export const removeFromList = async (listId: string, tmdbId: number): Promise<void> => {
  const response = await requestJson(`/api/lists/${listId}/movies/${tmdbId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Could not remove this movie from the list.');
};
