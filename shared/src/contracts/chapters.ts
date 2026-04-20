import { z } from 'zod';
import {
  CampaignIdParamsSchema,
  CommonErrorResponses,
  OkResponseSchema,
} from './_common.js';

const ChapterIdParamsSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
});

export const ChapterLocationSchema = z.object({
  dn: z.number().int(),
  name: z.string(),
  verseCount: z.number().int(),
});
export type ChapterLocation = z.infer<typeof ChapterLocationSchema>;

export const ChapterSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  title: z.string(),
  menuOrder: z.number().int(),
  locations: z.array(ChapterLocationSchema),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const GetChaptersResponseSchema = z.array(ChapterSchema);
export type GetChaptersResponse = z.infer<typeof GetChaptersResponseSchema>;

export const GetChaptersContract = {
  params: CampaignIdParamsSchema,
  response: { 200: GetChaptersResponseSchema, ...CommonErrorResponses },
} as const;

export const CreateChapterBodySchema = z.object({
  code: z.string().min(1).max(32),
  title: z.string().min(1).max(128),
  menuOrder: z.number().int().nonnegative(),
});
export type CreateChapterBody = z.infer<typeof CreateChapterBodySchema>;

export const CreatedChapterResponseSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  title: z.string(),
  menuOrder: z.number().int(),
});

export const CreateChapterContract = {
  params: CampaignIdParamsSchema,
  body: CreateChapterBodySchema,
  response: { 201: CreatedChapterResponseSchema, ...CommonErrorResponses },
} as const;

export const UpdateChapterBodySchema = z
  .object({
    code: z.string().min(1).max(32).optional(),
    title: z.string().min(1).max(128).optional(),
    menuOrder: z.number().int().nonnegative().optional(),
  })
  .refine(
    (b) => b.code !== undefined || b.title !== undefined || b.menuOrder !== undefined,
    { message: 'At least one field must be provided' },
  );
export type UpdateChapterBody = z.infer<typeof UpdateChapterBodySchema>;

export const UpdateChapterContract = {
  params: ChapterIdParamsSchema,
  body: UpdateChapterBodySchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;

export const DeleteChapterContract = {
  params: ChapterIdParamsSchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;

export const UpdateChapterLocationsBodySchema = z
  .object({
    addLocations: z.array(z.number().int()).optional(),
    removeLocations: z.array(z.number().int()).optional(),
  })
  .refine(
    (b) => (b.addLocations?.length ?? 0) + (b.removeLocations?.length ?? 0) > 0,
    { message: 'At least one addLocations or removeLocations entry required' },
  );
export type UpdateChapterLocationsBody = z.infer<typeof UpdateChapterLocationsBodySchema>;

export const UpdateChapterLocationsContract = {
  params: ChapterIdParamsSchema,
  body: UpdateChapterLocationsBodySchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;
