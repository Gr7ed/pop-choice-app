import { getRecommendationsFromApi } from './api-client';
import type { RecommendationResponse, Preferences } from './types';

export const parseRecommendationResponse = (response: string | null): RecommendationResponse => {
  if (typeof response !== 'string' || !response.trim()) {
    throw new Error('The recommendation service returned an empty response.');
  }
  const cleanedResponse = response
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let parsed: Partial<RecommendationResponse>;
  try {
    parsed = JSON.parse(cleanedResponse) as Partial<RecommendationResponse>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown JSON parse error';
    throw new Error(`The recommendation service returned malformed JSON: ${message}`, { cause: error });
  }
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    throw new Error('The recommendation service returned an invalid response.');
  }
  return parsed as RecommendationResponse;
};

export const getRecommendations = ({ favoriteMovie, mood, favoriteGenre }: Preferences) =>
  getRecommendationsFromApi({ favoriteMovie, mood, favoriteGenre });
