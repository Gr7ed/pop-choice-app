import { z } from 'zod';

export const preferencesSchema = z.object({
  favoriteMovie: z.string().trim().min(1).max(500),
  mood: z.string().trim().min(1).max(500),
  favoriteGenre: z.string().trim().min(1).max(500),
}).strict();

export const recommendationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  releaseYear: z.string().trim().min(1).max(10),
  content: z.string().trim().min(1).max(2000),
  posterUrl: z.string().url().nullable().optional(),
});

export const recommendationResponseSchema = z.object({
  recommendations: z.array(recommendationSchema).max(10),
});

export type PreferencesInput = z.infer<typeof preferencesSchema> & { userId?: string };
