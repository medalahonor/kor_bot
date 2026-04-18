import { z } from 'zod';
import {
  CampaignIdParamsSchema,
  PathCountSchema,
  CommonErrorResponses,
} from './_common.js';

export const KsVerseEntrySchema = z.object({
  verseDn: z.number().int(),
  locationDn: z.number().int(),
  ...PathCountSchema.shape,
});
export type KsVerseEntry = z.infer<typeof KsVerseEntrySchema>;

export const KsVersesResponseSchema = z.object({
  verses: z.array(KsVerseEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type KsVersesResponse = z.infer<typeof KsVersesResponseSchema>;

export const KsVersesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  onlyNew: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const GetKsVersesContract = {
  params: CampaignIdParamsSchema,
  querystring: KsVersesQuerySchema,
  response: { 200: KsVersesResponseSchema, ...CommonErrorResponses },
} as const;
