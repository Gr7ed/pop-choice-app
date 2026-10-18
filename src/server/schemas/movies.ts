import { z } from 'zod';

/**
 * Sort values accepted by TMDB's `/discover/movie` endpoint. Mirroring the
 * official reference here keeps the client dropdowns and the proxy in sync.
 */
export const discoverSortValues = [
  'original_title.asc',
  'original_title.desc',
  'popularity.asc',
  'popularity.desc',
  'revenue.asc',
  'revenue.desc',
  'primary_release_date.asc',
  'primary_release_date.desc',
  'title.asc',
  'title.desc',
  'vote_average.asc',
  'vote_average.desc',
  'vote_count.asc',
  'vote_count.desc',
] as const;

export const discoverSortSchema = z.enum(discoverSortValues);

// TMDB only serves the first 500 pages of any discover query.
const MAX_PAGE = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Query values arrive as text; treat blanks as "not provided" before coercing. */
const blankToUndefined = (value: unknown) => (value === '' ? undefined : value);

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().min(1).max(max).optional());

const optionalDate = z.preprocess(
  blankToUndefined,
  z.string().regex(DATE_PATTERN, 'Use the YYYY-MM-DD format.').optional(),
);

const optionalInt = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(min).max(max).optional());

const optionalFloat = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min).max(max).optional());

/** `z.coerce.boolean()` would treat the string "false" as truthy, so parse explicitly. */
const optionalBoolean = z.preprocess(
  (value) => (typeof value === 'string' ? value.toLowerCase() === 'true' : value),
  z.boolean().optional(),
);

/**
 * `/api/movies/discover` query schema. This is a faithful subset of TMDB's
 * `/discover/movie` parameters: filters that accept list values use TMDB's
 * comma (`AND`) / pipe (`OR`) syntax and are passed through as-is.
 */
export const discoverMovieQuerySchema = z.object({
  certification: optionalText(20),
  'certification.gte': optionalText(20),
  'certification.lte': optionalText(20),
  certification_country: optionalText(8),
  include_adult: optionalBoolean.default(false),
  include_video: optionalBoolean.default(false),
  language: optionalText(20).default('en-US'),
  page: optionalInt(1, MAX_PAGE).default(1),
  primary_release_year: optionalInt(1888, 2100),
  'primary_release_date.gte': optionalDate,
  'primary_release_date.lte': optionalDate,
  region: optionalText(8),
  'release_date.gte': optionalDate,
  'release_date.lte': optionalDate,
  sort_by: z.preprocess(blankToUndefined, discoverSortSchema.default('popularity.desc')),
  'vote_average.gte': optionalFloat(0, 10),
  'vote_average.lte': optionalFloat(0, 10),
  'vote_count.gte': optionalFloat(0, 1_000_000),
  'vote_count.lte': optionalFloat(0, 1_000_000),
  watch_region: optionalText(8),
  with_cast: optionalText(400),
  with_companies: optionalText(400),
  with_crew: optionalText(400),
  with_genres: optionalText(400),
  with_keywords: optionalText(400),
  with_origin_country: optionalText(100),
  with_original_language: optionalText(10),
  with_people: optionalText(400),
  with_release_type: optionalText(50),
  'with_runtime.gte': optionalInt(0, 1_000),
  'with_runtime.lte': optionalInt(0, 1_000),
  with_watch_monetization_types: optionalText(100),
  with_watch_providers: optionalText(200),
  without_companies: optionalText(400),
  without_genres: optionalText(400),
  without_keywords: optionalText(400),
  without_watch_providers: optionalText(200),
  year: optionalInt(1888, 2100),
});

export type DiscoverMovieQuery = z.infer<typeof discoverMovieQuerySchema>;

/** `/api/movies/now-playing` only needs pagination (and locale/region) knobs. */
export const nowPlayingQuerySchema = z.object({
  language: optionalText(20).default('en-US'),
  page: optionalInt(1, MAX_PAGE).default(1),
  region: optionalText(8),
});

export type NowPlayingQuery = z.infer<typeof nowPlayingQuerySchema>;
