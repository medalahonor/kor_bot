import { z } from 'zod';
import {
  DnParamsSchema,
  PathCountSchema,
  CommonErrorResponses,
} from './_common.js';

export const PathStepSchema = z.object({
  verseDn: z.number().int(),
  optionId: z.number().int(),
  text: z.string(),
  position: z.number().int(),
  type: z.string(),
});
export type PathStep = z.infer<typeof PathStepSchema>;

export const RemainingOptionSchema = z.object({
  option: z.object({
    id: z.number().int(),
    text: z.string(),
    type: z.string(),
    requirement: z.string().nullable(),
    position: z.number().int(),
  }),
  verseDn: z.number().int(),
  pathFromEntry: z.array(PathStepSchema),
});
export type RemainingOption = z.infer<typeof RemainingOptionSchema>;

export const RemainingResponseSchema = z.object({
  locationDn: z.number().int(),
  ...PathCountSchema.shape,
  remaining: z.array(RemainingOptionSchema),
});
export type RemainingResponse = z.infer<typeof RemainingResponseSchema>;

export const RemainingQuerySchema = z.object({
  campaign: z.coerce.number().int().positive().default(1),
  startVerse: z.coerce.number().int().nonnegative().default(0),
});

export const GetRemainingContract = {
  params: DnParamsSchema,
  querystring: RemainingQuerySchema,
  response: { 200: RemainingResponseSchema, ...CommonErrorResponses },
} as const;
