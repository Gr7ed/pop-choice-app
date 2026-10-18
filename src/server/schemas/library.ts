import { z } from 'zod';

export const moviePayloadSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  overview: z.string().trim().max(2000).optional(),
  releaseYear: z.coerce.number().int().min(1888).max(2100).nullable().optional(),
  posterUrl: z.string().trim().max(500).optional(),
  voteAverage: z.coerce.number().min(0).max(10).optional(),
});

export const listCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const tmdbIdParamSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
});

export const listIdParamSchema = z.object({
  listId: z.string().uuid(),
});

export type MoviePayload = z.infer<typeof moviePayloadSchema>;
