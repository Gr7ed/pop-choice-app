// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const fetchUrl = (fetchMock: ReturnType<typeof vi.fn>): URL => new URL(String(fetchMock.mock.calls[0]?.[0]));

const env = { TMDB_API_KEY: 'test-key' };

describe('movie routes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('validates a discover query and forwards it to TMDB', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ page: 2, results: [], total_pages: 4, total_results: 80 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request(
      '/api/movies/discover?page=2&sort_by=vote_average.desc&with_genres=878&vote_average.gte=7&include_video=true&page_size=99',
      {},
      env,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ page: 2, results: [], totalPages: 4, totalResults: 80 });

    const url = fetchUrl(fetchMock);
    expect(url.pathname).toBe('/3/discover/movie');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('sort_by')).toBe('vote_average.desc');
    expect(url.searchParams.get('with_genres')).toBe('878');
    expect(url.searchParams.get('vote_average.gte')).toBe('7');
    expect(url.searchParams.get('include_video')).toBe('true');
    expect(url.searchParams.get('include_adult')).toBe('false');
    expect(url.searchParams.has('page_size')).toBe(false);
  });

  it('rejects unsupported sort values before calling TMDB', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request('/api/movies/discover?sort_by=hotness', {}, env);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves a page of now playing movies', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ page: 1, results: [], total_pages: 2, total_results: 40 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await createApp().request('/api/movies/now-playing?page=1', {}, env);

    expect(response.status).toBe(200);
    const url = fetchUrl(fetchMock);
    expect(url.pathname).toBe('/3/movie/now_playing');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('language')).toBe('en-US');
  });

  it('returns a 503 when TMDB credentials are missing', async () => {
    const response = await createApp().request('/api/movies/now-playing', {}, {});
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'TMDB_NOT_CONFIGURED' } });
  });
});
