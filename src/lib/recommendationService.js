import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { movieRecommendationSchema, webSearchToolSchema } from './api/schemas.js';

const CHAT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const MATCH_THRESHOLD = 0.5;
const MATCH_COUNT = 3;
const SYSTEM_PROMPT = `You are an expert movie recommendation assistant. Provide highly relevant movie recommendations based on the user's preferences.
Use the supplied context first, use web_search when current information is needed, and explain why each recommendation fits.
Return at least 5 recommendations when possible, but prioritize relevance.`;

let clients;

const getClients = () => {
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

const searchMovies = async (query) => {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) return [];
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`);
  if (!response.ok) throw new Error('Movie search is temporarily unavailable.');
  const data = await response.json();
  return data.results?.slice(0, 5) ?? [];
};

const getChatCompletion = async (openai, context, query) => {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Context: ${context}\nQuestion: ${query}` },
  ];
  const config = {
    model: CHAT_MODEL,
    temperature: 0.5,
    frequency_penalty: 0.5,
    response_format: { type: 'json_schema', json_schema: movieRecommendationSchema },
    tools: [webSearchToolSchema],
  };
  let message = (await openai.chat.completions.create({ ...config, messages })).choices[0].message;
  if (message.tool_calls) {
    messages.push(message);
    for (const toolCall of message.tool_calls) {
      if (toolCall.function.name !== 'web_search') continue;
      const { query: searchQuery } = JSON.parse(toolCall.function.arguments);
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
    message = (await openai.chat.completions.create({ ...config, messages })).choices[0].message;
  }
  return message.content;
};

export const parseRecommendationResponse = (response) => {
  if (typeof response !== 'string' || !response.trim()) {
    throw new Error('The recommendation service returned an empty response.');
  }
  const cleanedResponse = response
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed = JSON.parse(cleanedResponse);
  if (!parsed || !Array.isArray(parsed.recommendations)) {
    throw new Error('The recommendation service returned an invalid response.');
  }
  return parsed;
};

export const getRecommendations = async ({ favoriteMovie, mood, favoriteGenre }) => {
  const { openai, supabase } = getClients();
  const query = `My favorite movie is ${favoriteMovie}. My current mood is ${mood}. My preferred genres are ${favoriteGenre}.`;
  const embeddingResponse = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: query });
  const { data, error } = await supabase.rpc('match_movies', {
    query_embedding: embeddingResponse.data[0].embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
  });
  if (error) throw error;
  const context = data?.length
    ? data.map((match, index) => `[Rank ${index + 1}]: ${match.content}`).join('\n')
    : 'No local movie context found.';
  const response = await getChatCompletion(openai, context, query);
  const parsed = parseRecommendationResponse(response);
  return Promise.all((parsed.recommendations ?? []).map(async (movie) => {
    const poster = (await searchMovies(movie.title))[0];
    return {
      ...movie,
      posterUrl: poster?.poster_path ? `https://image.tmdb.org/t/p/w500${poster.poster_path}` : null,
    };
  }));
};
