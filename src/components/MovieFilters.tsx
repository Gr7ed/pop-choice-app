import { useId } from 'react';
import type { ReactElement } from 'react';
import { LuRotateCcw, LuSlidersHorizontal } from 'react-icons/lu';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  defaultMovieFilters,
  genreOptions,
  languageOptions,
  ratingOptions,
  sortOptions,
  yearOptions,
} from '../lib/movie-filters';
import type { FilterOption } from '../lib/movie-filters';
import type { MovieFilters as MovieFiltersValue } from '../lib/types';

interface MovieFiltersProps {
  value: MovieFiltersValue;
  onChange: (value: MovieFiltersValue) => void;
  disabled?: boolean;
}

const fields: Array<{ key: keyof MovieFiltersValue; label: string; options: FilterOption[] }> = [
  { key: 'sortBy', label: 'Sort by', options: sortOptions },
  { key: 'genre', label: 'Genre', options: [{ value: '', label: 'All genres' }, ...genreOptions] },
  { key: 'year', label: 'Release year', options: yearOptions },
  { key: 'minRating', label: 'Minimum rating', options: ratingOptions },
  { key: 'language', label: 'Language', options: languageOptions },
];

/**
 * Radix Select reserves the empty string for its placeholder, so "Any …"
 * options round-trip through a sentinel and are mapped back to `''` on change.
 */
const ANY_VALUE = 'any';
const toSelectValue = (filterValue: string): string => (filterValue === '' ? ANY_VALUE : filterValue);
const fromSelectValue = (selectValue: string): string =>
  selectValue === ANY_VALUE ? '' : selectValue;

const countActiveFilters = (value: MovieFiltersValue): number =>
  (Object.keys(defaultMovieFilters) as Array<keyof MovieFiltersValue>).filter(
    (key) => value[key] !== defaultMovieFilters[key],
  ).length;

/**
 * Controlled filter bar for the discover grid. Every control maps to a TMDB
 * `/discover/movie` parameter, so changing one re-runs the query immediately.
 */
export default function MovieFilters({ value, onChange, disabled = false }: MovieFiltersProps): ReactElement {
  const id = useId();
  const activeCount = countActiveFilters(value);
  const update = (key: keyof MovieFiltersValue, next: string) => onChange({ ...value, [key]: next });

  return (
    <form aria-label="Movie filters" onSubmit={(event) => event.preventDefault()}>
      <Card className="bg-card/70">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
              <LuSlidersHorizontal className="size-3.5" aria-hidden="true" />
            </span>
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeCount} active
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Narrow the catalogue by genre, release year, rating, or original language.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || activeCount === 0}
              onClick={() => onChange(defaultMovieFilters)}
            >
              <LuRotateCcw aria-hidden="true" /> Reset
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
            {fields.map(({ key, label, options }) => {
              const fieldId = `${id}-${key}`;

              return (
                <div key={key} className="grid gap-1.5">
                  <Label htmlFor={fieldId} className="text-xs font-medium text-muted-foreground">
                    {label}
                  </Label>
                  <Select
                    value={toSelectValue(value[key])}
                    disabled={disabled}
                    onValueChange={(next) => update(key, fromSelectValue(next))}
                  >
                    <SelectTrigger
                      id={fieldId}
                      className="w-full border-input/80 bg-background/50 transition-colors hover:bg-background/70"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {options.map((option) => (
                        <SelectItem key={option.value || ANY_VALUE} value={toSelectValue(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
