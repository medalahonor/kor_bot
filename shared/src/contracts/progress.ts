import { z } from 'zod';
import { OptionStatusSchema } from '../enums/optionStatus.js';
import { CommonErrorResponses } from './_common.js';

export const PutProgressBodySchema = z.object({
  optionId: z.number().int().positive(),
  status: OptionStatusSchema,
});
export type PutProgressBody = z.infer<typeof PutProgressBodySchema>;

export const PutProgressResponseSchema = z.object({
  ok: z.literal(true),
});
export type PutProgressResponse = z.infer<typeof PutProgressResponseSchema>;

export const PutProgressContract = {
  body: PutProgressBodySchema,
  response: { 200: PutProgressResponseSchema, ...CommonErrorResponses },
} as const;

export const PutProgressBatchBodySchema = z.object({
  optionIds: z.array(z.number().int().positive()).min(1).max(50),
  status: OptionStatusSchema,
});
export type PutProgressBatchBody = z.infer<typeof PutProgressBatchBodySchema>;

export const PutProgressBatchResponseSchema = z.object({
  ok: z.literal(true),
  count: z.number().int().nonnegative(),
});
export type PutProgressBatchResponse = z.infer<typeof PutProgressBatchResponseSchema>;

export const PutProgressBatchContract = {
  body: PutProgressBatchBodySchema,
  response: { 200: PutProgressBatchResponseSchema, ...CommonErrorResponses },
} as const;
