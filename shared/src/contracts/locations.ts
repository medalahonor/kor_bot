import { z } from 'zod';
import {
  DnParamsSchema,
  CampaignQuerySchema,
  CommonErrorResponses,
} from './_common.js';
import { OptionStatusSchema } from '../enums/optionStatus.js';

export const ConditionalTargetSchema = z.object({
  condition: z.string(),
  verse: z.number().int().optional(),
  location: z.number().int().optional(),
  result: z.string().optional(),
  target: z.string().optional(),
});
export type ConditionalTarget = z.infer<typeof ConditionalTargetSchema>;

type ChildOption = {
  type: string;
  text: string;
  target: { verse: number; location?: number } | 'end' | null;
  requirement?: string;
  result?: string;
  children?: ChildOption[];
};

export const ChildOptionSchema: z.ZodType<ChildOption> = z.lazy(() =>
  z.object({
    type: z.string(),
    text: z.string(),
    target: z.union([
      z.object({ verse: z.number().int(), location: z.number().int().optional() }),
      z.literal('end'),
      z.null(),
    ]),
    requirement: z.string().optional(),
    result: z.string().optional(),
    children: z.array(ChildOptionSchema).optional(),
  }),
);

export const OptionSchema = z.object({
  id: z.number().int(),
  position: z.number().int(),
  type: z.enum(['choice', 'condition']),
  text: z.string(),
  targetType: z.enum(['verse', 'cross_location', 'end']).nullable(),
  targetVerseDn: z.number().int().nullable(),
  targetLocationDn: z.number().int().nullable(),
  requirement: z.string().nullable(),
  result: z.string().nullable(),
  hidden: z.string().nullable(),
  once: z.boolean(),
  conditionGroup: z.string().nullable(),
  conditionalTargets: z.array(ConditionalTargetSchema).nullable(),
  children: z.array(ChildOptionSchema).nullable(),
});
export type Option = z.infer<typeof OptionSchema>;

export const VerseSchema = z.object({
  id: z.number().int(),
  displayNumber: z.number().int(),
  options: z.array(OptionSchema),
});
export type Verse = z.infer<typeof VerseSchema>;

export const LocationDetailSchema = z.object({
  id: z.number().int(),
  displayNumber: z.number().int(),
  name: z.string(),
  verses: z.array(VerseSchema),
});
export type LocationDetail = z.infer<typeof LocationDetailSchema>;

export const GetLocationVersesContract = {
  params: DnParamsSchema,
  querystring: CampaignQuerySchema,
  response: { 200: LocationDetailSchema, ...CommonErrorResponses },
} as const;

export const LocationProgressSchema = z.object({
  locationDn: z.number().int(),
  optionStatuses: z.record(z.string(), OptionStatusSchema),
});
export type LocationProgress = z.infer<typeof LocationProgressSchema>;

export const GetLocationProgressContract = {
  params: DnParamsSchema,
  querystring: CampaignQuerySchema,
  response: { 200: LocationProgressSchema, ...CommonErrorResponses },
} as const;

export const VerseNumbersResponseSchema = z.object({
  verses: z.array(z.number().int()),
});
export type VerseNumbersResponse = z.infer<typeof VerseNumbersResponseSchema>;

export const GetVerseNumbersContract = {
  params: DnParamsSchema,
  querystring: CampaignQuerySchema,
  response: { 200: VerseNumbersResponseSchema, ...CommonErrorResponses },
} as const;
