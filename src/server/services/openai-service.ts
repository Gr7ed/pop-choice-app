import OpenAI from 'openai';
import { AppError } from '../lib/errors';
import type { CloudflareBindings } from '../types';

const CHAT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-ada-002';
const MAX_COMPLETION_TOKENS = 3000;

const responseSchema = {
  name: 'movie_recommendations_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            releaseYear: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title', 'releaseYear', 'content'],
          additionalProperties: false,
        },
      },
    },
    required: ['recommendations'],
    additionalProperties: false,
  },
} as const;

export class OpenAiService {
  private readonly client: OpenAI;

  constructor(bindings: CloudflareBindings) {
    const apiKey = bindings.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new AppError(503, 'OPENAI_NOT_CONFIGURED', 'OpenAI is not configured. Set OPENAI_API_KEY in .dev.vars and restart the Worker.');
    }
    this.client = new OpenAI({ apiKey });
  }

  async embed(query: string): Promise<number[]> {
    const response = await this.client.embeddings.create({ model: EMBEDDING_MODEL, input: query });
    const embedding = response.data[0]?.embedding;
    if (!embedding) throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'Embedding service returned no vector.');
    return embedding;
  }

  async recommend(context: string, query: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.5,
      frequency_penalty: 0.5,
      max_tokens: MAX_COMPLETION_TOKENS,
      response_format: { type: 'json_schema', json_schema: responseSchema },
      messages: [
        {
          role: 'system',
          content: 'You are an expert movie recommendation assistant. Use the supplied context first and return at least 5 relevant recommendations when possible. Return only the requested JSON object.',
        },
        { role: 'user', content: `Context: ${context}\nQuestion: ${query}` },
      ],
    } as Parameters<typeof this.client.chat.completions.create>[0]) as OpenAI.Chat.Completions.ChatCompletion;
    const content = response.choices[0]?.message.content;
    if (!content) throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'Recommendation service returned no content.');
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new AppError(502, 'UPSTREAM_INVALID_RESPONSE', 'Recommendation service returned malformed JSON.', error);
    }
  }
}
