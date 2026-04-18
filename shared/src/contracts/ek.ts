import { z } from 'zod';
import {
  CampaignIdParamsSchema,
  PathCountSchema,
  CommonErrorResponses,
} from './_common.js';

export const EkVerseEntrySchema = z.object({
  verseDn: z.number().int(),
  ...PathCountSchema.shape,
});
export type EkVerseEntry = z.infer<typeof EkVerseEntrySchema>;

export const EkLocationEntrySchema = z.object({
  locationDn: z.number().int(),
  name: z.string(),
  ...PathCountSchema.shape,
  verses: z.array(EkVerseEntrySchema),
});
export type EkLocationEntry = z.infer<typeof EkLocationEntrySchema>;

export const EkResponseSchema = z.object({
  locations: z.array(EkLocationEntrySchema),
});
export type EkResponse = z.infer<typeof EkResponseSchema>;

export const GetEkVersesContract = {
  params: CampaignIdParamsSchema,
  response: { 200: EkResponseSchema, ...CommonErrorResponses },
} as const;
