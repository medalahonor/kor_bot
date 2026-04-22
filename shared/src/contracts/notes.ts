import { z } from 'zod';
import {
  CampaignIdParamsSchema,
  VerseIdParamsSchema,
  CommonErrorResponses,
  OkResponseSchema,
} from './_common.js';

export const NoteTypeSchema = z.enum(['quest', 'hint', 'general']);
export type NoteType = z.infer<typeof NoteTypeSchema>;

export const NoteBodySchema = z.string().trim().min(1).max(2000);
export type NoteBody = z.infer<typeof NoteBodySchema>;

export const NotePathStepSchema = z.object({
  locationDn: z.number().int().nonnegative(),
  verseDn: z.number().int().nonnegative(),
});
export type NotePathStep = z.infer<typeof NotePathStepSchema>;

/**
 * Полная история навигации от entry до target включительно.
 * path[last] — target строфа (к ней резолвится verseId и создаётся FK CASCADE).
 * Промежуточные шаги — доверенная история юзера (explorationPath + current), не валидируется на уровне БД.
 */
export const NotePathSchema = z.array(NotePathStepSchema).min(1).max(50);
export type NotePath = z.infer<typeof NotePathSchema>;

export const NoteSchema = z.object({
  id: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  type: NoteTypeSchema,
  body: z.string(),
  verseId: z.number().int().positive().nullable(),
  path: NotePathSchema.nullable(),
  locationName: z.string().nullable(),
  createdAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const NotesListSchema = z.array(NoteSchema);
export type NotesList = z.infer<typeof NotesListSchema>;

export const NoteIdParamsSchema = z.object({
  noteId: z.coerce.number().int().positive(),
});
export type NoteIdParams = z.infer<typeof NoteIdParamsSchema>;

export const GetCampaignNotesQuerySchema = z.object({
  type: NoteTypeSchema.optional(),
});
export type GetCampaignNotesQuery = z.infer<typeof GetCampaignNotesQuerySchema>;

export const GetCampaignNotesContract = {
  params: CampaignIdParamsSchema,
  querystring: GetCampaignNotesQuerySchema,
  response: { 200: NotesListSchema, ...CommonErrorResponses },
} as const;

export const GetVerseNotesContract = {
  params: VerseIdParamsSchema,
  response: { 200: NotesListSchema, ...CommonErrorResponses },
} as const;

export const CreateNoteBodySchema = z.object({
  type: NoteTypeSchema,
  body: NoteBodySchema,
  path: NotePathSchema.nullable().optional(),
});
export type CreateNoteBody = z.infer<typeof CreateNoteBodySchema>;

export const CreateNoteContract = {
  params: CampaignIdParamsSchema,
  body: CreateNoteBodySchema,
  response: { 201: NoteSchema, ...CommonErrorResponses },
} as const;

export const UpdateNoteBodySchema = z.object({
  type: NoteTypeSchema,
  body: NoteBodySchema,
});
export type UpdateNoteBody = z.infer<typeof UpdateNoteBodySchema>;

export const UpdateNoteContract = {
  params: NoteIdParamsSchema,
  body: UpdateNoteBodySchema,
  response: { 200: NoteSchema, ...CommonErrorResponses },
} as const;

export const DeleteNoteContract = {
  params: NoteIdParamsSchema,
  response: { 200: OkResponseSchema, ...CommonErrorResponses },
} as const;
