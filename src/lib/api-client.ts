import type { MovieRecommendation, Preferences } from './types';

interface RecommendationApiResponse {
  recommendations: MovieRecommendation[];
}

export const getRecommendationsFromApi = async (preferences: Preferences): Promise<MovieRecommendation[]> => {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(preferences),
  });
  const body = await response.json() as RecommendationApiResponse | { error?: { message?: string } };
  if (!response.ok) {
    throw new Error('error' in body ? body.error?.message || 'Recommendation request failed.' : 'Recommendation request failed.');
  }
  if (!('recommendations' in body) || !Array.isArray(body.recommendations)) {
    throw new Error('Recommendation service returned an invalid response.');
  }
  return body.recommendations;
};
