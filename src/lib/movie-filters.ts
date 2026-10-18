import type { MovieFilters } from './types';

export interface FilterOption {
  value: string;
  label: string;
}

/** The filter state the browse page starts from (TMDB's own defaults). */
export const defaultMovieFilters: MovieFilters = {
  sortBy: 'popularity.desc',
  genre: '',
  year: '',
  minRating: '',
  language: '',
};

/** A subset of TMDB's `/discover/movie` sort options, in a friendly order. */
export const sortOptions: FilterOption[] = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'vote_count.desc', label: 'Most voted' },
  { value: 'primary_release_date.desc', label: 'Newest releases' },
  { value: 'primary_release_date.asc', label: 'Oldest releases' },
  { value: 'revenue.desc', label: 'Highest grossing' },
  { value: 'original_title.asc', label: 'Title (A–Z)' },
  { value: 'original_title.desc', label: 'Title (Z–A)' },
];

/** TMDB movie genre ids. */
export const genreOptions: FilterOption[] = [
  { value: '28', label: 'Action' },
  { value: '12', label: 'Adventure' },
  { value: '16', label: 'Animation' },
  { value: '35', label: 'Comedy' },
  { value: '80', label: 'Crime' },
  { value: '99', label: 'Documentary' },
  { value: '18', label: 'Drama' },
  { value: '10751', label: 'Family' },
  { value: '14', label: 'Fantasy' },
  { value: '36', label: 'History' },
  { value: '27', label: 'Horror' },
  { value: '10402', label: 'Music' },
  { value: '9648', label: 'Mystery' },
  { value: '10749', label: 'Romance' },
  { value: '878', label: 'Science Fiction' },
  { value: '53', label: 'Thriller' },
  { value: '10752', label: 'War' },
  { value: '37', label: 'Western' },
];

export const languageOptions: FilterOption[] = [
  { value: '', label: 'Any language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'hi', label: 'Hindi' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
];

export const ratingOptions: FilterOption[] = [
  { value: '', label: 'Any rating' },
  { value: '5', label: '5+ / 10' },
  { value: '6', label: '6+ / 10' },
  { value: '7', label: '7+ / 10' },
  { value: '8', label: '8+ / 10' },
  { value: '9', label: '9+ / 10' },
];

/** Release years, newest first, ending at cinema's earliest feature films. */
export const yearOptions: FilterOption[] = [
  { value: '', label: 'Any year' },
  ...Array.from({ length: new Date().getFullYear() + 1 - 1900 + 1 }, (_, index) => {
    const year = new Date().getFullYear() + 1 - index;
    return { value: String(year), label: String(year) };
  }),
];
