import { z } from 'zod';

export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
