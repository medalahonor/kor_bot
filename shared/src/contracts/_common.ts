import { z } from 'zod';
import { ApiErrorSchema } from '../errors/apiError.js';

export const CampaignIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const DnParamsSchema = z.object({
  dn: z.coerce.number().int().nonnegative(),
});

export const OptionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const VerseIdParamsSchema = z.object({
  verseId: z.coerce.number().int().positive(),
});

export const LocationIdParamsSchema = z.object({
  locationId: z.coerce.number().int().positive(),
});

export const CampaignQuerySchema = z.object({
  campaign: z.coerce.number().int().positive().default(1),
});

export const PathCountSchema = z.object({
  totalPaths: z.number().int(),
  completedPaths: z.number().int(),
  totalCyclic: z.number().int(),
  completedCyclic: z.number().int(),
});
export type PathCount = z.infer<typeof PathCountSchema>;

export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;

export const CommonErrorResponses = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  409: ApiErrorSchema,
  500: ApiErrorSchema,
} as const;
