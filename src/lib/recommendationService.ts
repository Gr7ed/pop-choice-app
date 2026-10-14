import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { movieRecommendationSchema, webSearchToolSchema } from './api/schemas';
import type {
  MovieMatch,
  RecommendationResponse,
  Preferences,
  ServiceClients,
  TmdbMovie,
  TmdbSearchResponse,
  WebSearchArguments,
} from './types';

const CHAT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const MATCH_THRESHOLD = 0.5;
const MATCH_COUNT = 3;
const MAX_COMPLETION_TOKENS = 3000;
const SYSTEM_PROMPT = `You are an expert movie recommendation assistant. Provide highly relevant movie recommendations based on the user's preferences.
Use the supplied context first, use web_search when current information is needed, and explain why each recommendation fits.
Return at least 5 recommendations when possible, but prioritize relevance.`;

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface CompletionMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCall[];
}

type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

let clients: ServiceClients | undefined;

const getClients = (): ServiceClients => {
  const { VITE_OPENAI_API_KEY: openAiKey, VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_PUBLISHABLE_KEY: supabaseKey } = import.meta.env;
  if (!openAiKey || !supabaseUrl || !supabaseKey) {
    throw new Error('Recommendation services are not configured. Add the required VITE_ environment variables.');
  }
  let parsedSupabaseUrl;
  try {
    parsedSupabaseUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL.');
  }
  if (!['http:', 'https:'].includes(parsedSupabaseUrl.protocol)) {
    throw new Error('VITE_SUPABASE_URL must use http or https.');
  }
  if (clients) return clients;
  clients = {
    openai: new OpenAI({ apiKey: openAiKey, dangerouslyAllowBrowser: true }),
    supabase: createClient(parsedSupabaseUrl.toString().replace(/\/$/, ''), supabaseKey),
  };
  return clients;
};

const searchMovies = async (query: string): Promise<TmdbMovie[]> => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) return [];
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`);
  if (!response.ok) throw new Error('Movie search is temporarily unavailable.');
  const data: TmdbSearchResponse = await response.json();
  return data.results?.slice(0, 5) ?? [];
};

const getChatCompletion = async (openai: OpenAI, context: string, query: string): Promise<string | null> => {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Context: ${context}\nQuestion: ${query}` },
  ];
  const config = {
    model: CHAT_MODEL,
    temperature: 0.5,
    frequency_penalty: 0.5,
    max_tokens: MAX_COMPLETION_TOKENS,
    response_format: { type: 'json_schema', json_schema: movieRecommendationSchema },
    tools: [webSearchToolSchema],
  };
  const createCompletion = (currentMessages: ChatMessage[]): Promise<{ choices: Array<{ message: CompletionMessage }> }> =>
    openai.chat.completions.create({
      ...config,
      messages: currentMessages,
    } as Parameters<typeof openai.chat.completions.create>[0]) as Promise<{ choices: Array<{ message: CompletionMessage }> }>;
  let message = (await createCompletion(messages)).choices[0].message;
  if (message.tool_calls) {
    messages.push(message);
    for (const toolCall of message.tool_calls) {
      if (toolCall.function.name !== 'web_search') continue;
      const { query: searchQuery } = JSON.parse(toolCall.function.arguments) as WebSearchArguments;
      let result = `No current results found for "${searchQuery}".`;
      try {
        const results = await searchMovies(searchQuery);
        if (results.length) {
          result = results.map((movie) => `Title: ${movie.title} (${movie.release_date?.slice(0, 4) ?? 'N/A'})\nOverview: ${movie.overview}`).join('\n\n');
        }
      } catch (error) {
        console.error(error);
      }
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: result });
    }
    message = (await createCompletion(messages)).choices[0].message;
  }
  return message.content;
};

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
    throw new Error(`The recommendation service returned malformed JSON: ${message}`);
  }
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    throw new Error('The recommendation service returned an invalid response.');
  }
  return parsed as RecommendationResponse;
};

export const getRecommendations = async ({ favoriteMovie, mood, favoriteGenre }: Preferences) => {
  const { openai, supabase } = getClients();
  const query = `My favorite movie is ${favoriteMovie}. My current mood is ${mood}. My preferred genres are ${favoriteGenre}.`;
  const embeddingResponse = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: query });
  const { data, error } = await supabase.rpc('match_movies', {
    query_embedding: embeddingResponse.data[0].embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
  });
  if (error) throw error;
  const matches = (data ?? []) as MovieMatch[];
  const context = matches.length
    ? matches.map((match, index) => `[Rank ${index + 1}]: ${match.content}`).join('\n')
    : 'No local movie context found.';
  const response = await getChatCompletion(openai, context, query);
  let parsed: RecommendationResponse;
  try {
    parsed = parseRecommendationResponse(response);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('malformed JSON')) throw error;
    const retryResponse = await getChatCompletion(
      openai,
      context,
      `${query}\nReturn only a complete JSON object matching the required schema. Keep each recommendation explanation concise and do not truncate the response.`,
    );
    parsed = parseRecommendationResponse(retryResponse);
  }
  return Promise.all((parsed.recommendations ?? []).map(async (movie) => {
    const poster = (await searchMovies(movie.title))[0];
    return {
      ...movie,
      posterUrl: poster?.poster_path ? `https://image.tmdb.org/t/p/w500${poster.poster_path}` : null,
    };
  }));
};
