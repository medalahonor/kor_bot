import { z } from 'zod';
import { CampaignIdParamsSchema, PathCountSchema, CommonErrorResponses } from './_common.js';

export const CampaignSchema = z.object({
  id: z.number().int(),
  source_id: z.number().int(),
  name: z.string(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const GetCampaignsResponseSchema = z.array(CampaignSchema);
export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;

export const GetCampaignsContract = {
  response: { 200: GetCampaignsResponseSchema, ...CommonErrorResponses },
} as const;

export const LocationSchema = z.object({
  id: z.number().int(),
  displayNumber: z.number().int(),
  name: z.string(),
  verseCount: z.number().int(),
});
export type Location = z.infer<typeof LocationSchema>;

export const GetCampaignLocationsResponseSchema = z.array(LocationSchema);
export type GetCampaignLocationsResponse = z.infer<typeof GetCampaignLocationsResponseSchema>;

export const GetCampaignLocationsContract = {
  params: CampaignIdParamsSchema,
  response: { 200: GetCampaignLocationsResponseSchema, ...CommonErrorResponses },
} as const;

export const BatchLocationProgressSchema = z.object({
  displayNumber: z.number().int(),
  ...PathCountSchema.shape,
});
export type BatchLocationProgress = z.infer<typeof BatchLocationProgressSchema>;

export const GetBatchProgressResponseSchema = z.array(BatchLocationProgressSchema);
export type GetBatchProgressResponse = z.infer<typeof GetBatchProgressResponseSchema>;

export const GetBatchProgressContract = {
  params: CampaignIdParamsSchema,
  response: { 200: GetBatchProgressResponseSchema, ...CommonErrorResponses },
} as const;
