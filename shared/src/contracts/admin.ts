import { z } from 'zod';
import {
  OptionIdParamsSchema,
  VerseIdParamsSchema,
  LocationIdParamsSchema,
  CommonErrorResponses,
  OkResponseSchema,
} from './_common.js';

const HiddenSchema = z
  .enum(['red_filter', 'blue_filter', 'both_filters', 'filter'])
  .nullable();

const OptionTypeSchema = z.enum(['choice', 'condition']);
const TargetTypeSchema = z.enum(['verse', 'cross_location', 'end']).nullable();

export const UpdateOptionBodySchema = z.object({
  text: z.string().optional(),
  type: OptionTypeSchema.optional(),
  targetType: TargetTypeSchema.optional(),
  targetVerseDn: z.number().int().nullable().optional(),
  targetLocationDn: z.number().int().nullable().optional(),
  requirement: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  hidden: HiddenSchema.optional(),
  once: z.boolean().optional(),
  conditionGroup: z.string().nullable().optional(),
  conditionalTargets: z.unknown().nullable().optional(),
  children: z.unknown().nullable().optional(),
});
export type UpdateOptionBody = z.infer<typeof UpdateOptionBodySchema>;

export const CreateOptionBodySchema = z.object({
  type: OptionTypeSchema,
  text: z.string().default(''),
  targetType: TargetTypeSchema.default(null),
  targetVerseDn: z.number().int().nullable().default(null),
  targetLocationDn: z.number().int().nullable().default(null),
  requirement: z.string().nullable().default(null),
  result: z.string().nullable().default(null),
  hidden: HiddenSchema.default(null),
  once: z.boolean().default(false),
  conditionGroup: z.string().nullable().default(null),
  conditionalTargets: z.unknown().nullable().default(null),
  children: z.unknown().nullable().default(null),
});
export type CreateOptionBody = z.infer<typeof CreateOptionBodySchema>;

export const OptionRowSchema = z.object({
  id: z.number().int(),
  verse_id: z.number().int(),
  position: z.number().int(),
  type: z.string(),
  text: z.string(),
  target_type: z.string().nullable(),
  target_verse_dn: z.number().int().nullable(),
  target_location_dn: z.number().int().nullable(),
  requirement: z.string().nullable(),
  result: z.string().nullable(),
  hidden: z.string().nullable(),
  once: z.boolean(),
  condition_group: z.string().nullable(),
  conditional_targets: z.unknown().nullable(),
  children: z.unknown().nullable(),
});
export type OptionRow = z.infer<typeof OptionRowSchema>;

export const UpdateOptionContract = {
  params: OptionIdParamsSchema,
  body: UpdateOptionBodySchema,
  response: { 200: OptionRowSchema, ...CommonErrorResponses },
} as const;

export const CreateOptionContract = {
  params: VerseIdParamsSchema,
  body: CreateOptionBodySchema,
  response: { 201: OptionRowSchema, ...CommonErrorResponses },
} as const;

export const DeleteOptionContract = {
  params: OptionIdParamsSchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;

export const UpdateVerseBodySchema = z.object({
  displayNumber: z.number().int().min(0),
});
export type UpdateVerseBody = z.infer<typeof UpdateVerseBodySchema>;

export const CreateVerseBodySchema = z.object({
  displayNumber: z.number().int().min(0),
});
export type CreateVerseBody = z.infer<typeof CreateVerseBodySchema>;

export const VerseRowSchema = z.object({
  id: z.number().int(),
  location_id: z.number().int(),
  display_number: z.number().int(),
});
export type VerseRow = z.infer<typeof VerseRowSchema>;

export const UpdateVerseContract = {
  params: OptionIdParamsSchema,
  body: UpdateVerseBodySchema,
  response: { 200: VerseRowSchema, ...CommonErrorResponses },
} as const;

export const CreateVerseContract = {
  params: LocationIdParamsSchema,
  body: CreateVerseBodySchema,
  response: { 201: VerseRowSchema, ...CommonErrorResponses },
} as const;

export const DeleteVerseContract = {
  params: OptionIdParamsSchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;
