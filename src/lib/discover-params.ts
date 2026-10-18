import {
  defaultMovieFilters,
  genreOptions,
  languageOptions,
  ratingOptions,
  sortOptions,
  yearOptions,
} from './movie-filters';
import type { FilterOption } from './movie-filters';
import type { MovieFilters } from './types';

export type DiscoverTab = 'discover' | 'nowPlaying';

export interface DiscoverState {
  tab: DiscoverTab;
  filters: MovieFilters;
  page: number;
}

/** TMDB stops serving discover results after page 500. */
export const MAX_DISCOVER_PAGE = 500;

/**
 * URL keys mirror TMDB's own query names, so a `/discover` link reads like the
 * API request it produces: `?sort_by=vote_average.desc&with_genres=878`.
 */
const filterParams: Array<{ param: string; key: keyof MovieFilters; options: FilterOption[] }> = [
  { param: 'sort_by', key: 'sortBy', options: sortOptions },
  { param: 'with_genres', key: 'genre', options: genreOptions },
  { param: 'primary_release_year', key: 'year', options: yearOptions },
  { param: 'vote_average.gte', key: 'minRating', options: ratingOptions },
  { param: 'with_original_language', key: 'language', options: languageOptions },
];

const isValidOption = (options: FilterOption[], value: string): boolean =>
  options.some((option) => option.value === value);

const readPage = (params: URLSearchParams): number => {
  const raw = params.get('page');
  if (raw === null) return 1;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;

  return Math.min(parsed, MAX_DISCOVER_PAGE);
};

const readTab = (params: URLSearchParams): DiscoverTab =>
  params.get('tab') === 'nowPlaying' ? 'nowPlaying' : 'discover';

/**
 * Rebuild the discover state from a URL. Unknown or malformed values fall back
 * to the defaults instead of rendering a control with no selected option.
 */
export const readDiscoverState = (params: URLSearchParams): DiscoverState => {
  const filters: MovieFilters = { ...defaultMovieFilters };

  for (const { param, key, options } of filterParams) {
    const value = params.get(param);
    if (value !== null && isValidOption(options, value)) {
      filters[key] = value;
    }
  }

  return { tab: readTab(params), filters, page: readPage(params) };
};

/**
 * Write only the values that differ from the defaults. Copying the resulting
 * URL restores the same filters, tab, and page.
 */
export const toDiscoverSearchParams = ({ tab, filters, page }: DiscoverState): URLSearchParams => {
  const params = new URLSearchParams();

  if (tab === 'nowPlaying') params.set('tab', 'nowPlaying');

  for (const { param, key } of filterParams) {
    const value = filters[key];
    if (value && value !== defaultMovieFilters[key]) params.set(param, value);
  }

  if (page > 1) params.set('page', String(Math.min(page, MAX_DISCOVER_PAGE)));

  return params;
};
