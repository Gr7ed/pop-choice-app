import { afterEach, describe, expect, it, vi } from 'vitest';
import { TmdbService } from './tmdb-service';

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const requestUrl = (fetchMock: ReturnType<typeof vi.fn>): URL => new URL(String(fetchMock.mock.calls[0]?.[0]));

describe('TmdbService.discoverMovies', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('forwards every supported filter and drops blank values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ page: 2, results: [], total_pages: 10, total_results: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const page = await new TmdbService('api-key').discoverMovies({
      page: 2,
      sort_by: 'vote_average.desc',
      with_genres: '878|12',
      without_genres: '27',
      'vote_average.gte': 7,
      'with_runtime.lte': 180,
      include_adult: false,
      region: 'US',
      blank: '',
      absent: undefined,
    });

    const url = requestUrl(fetchMock);
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('api_key')).toBe('api-key');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('sort_by')).toBe('vote_average.desc');
    expect(url.searchParams.get('with_genres')).toBe('878|12');
    expect(url.searchParams.get('without_genres')).toBe('27');
    expect(url.searchParams.get('vote_average.gte')).toBe('7');
    expect(url.searchParams.get('with_runtime.lte')).toBe('180');
    expect(url.searchParams.get('include_adult')).toBe('false');
    expect(url.searchParams.has('blank')).toBe(false);
    expect(url.searchParams.has('absent')).toBe(false);
    expect(page).toEqual({ page: 2, results: [], totalPages: 10, totalResults: 200 });
  });

  it('maps TMDB results into movie summaries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [
          { id: 438631, title: 'Dune', release_date: '2021-10-22', poster_path: '/dune.jpg', vote_average: 8.1 },
          { id: 0 },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const page = await new TmdbService('api-key').discoverMovies();

    expect(page.results).toEqual([
      {
        tmdbId: 438631,
        title: 'Dune',
        overview: '',
        releaseYear: 2021,
        releaseDate: '2021-10-22',
        posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
        voteAverage: 8.1,
      },
    ]);
  });
});

describe('TmdbService.nowPlaying', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('hits the now playing endpoint with pagination and region', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const page = await new TmdbService('api-key').nowPlaying({ page: 3, region: 'US' });

    const url = requestUrl(fetchMock);
    expect(url.pathname).toBe('/3/movie/now_playing');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('region')).toBe('US');
    expect(page.page).toBe(1);
    expect(page.totalPages).toBe(0);
  });

  it('sends the read token as a bearer header when configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await new TmdbService('eyJhbGciOiJIUzI1NiJ9.token').nowPlaying();

    const url = requestUrl(fetchMock);
    expect(url.searchParams.has('api_key')).toBe(false);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.token',
    });
  });
});
