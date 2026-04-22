import { z } from 'zod';
import { OptionStatusSchema } from '../enums/optionStatus.js';
import { NoteSchema } from '../contracts/notes.js';

export const ProgressEventSchema = z.object({
  type: z.literal('status_changed'),
  optionId: z.number().int().positive(),
  status: OptionStatusSchema,
  locationDn: z.number().int(),
  verseDn: z.number().int(),
  by: z.string(),
  timestamp: z.string(),
});
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

export const NoteCreatedEventSchema = z.object({
  type: z.literal('note_created'),
  note: NoteSchema,
});
export type NoteCreatedEvent = z.infer<typeof NoteCreatedEventSchema>;

export const NoteUpdatedEventSchema = z.object({
  type: z.literal('note_updated'),
  note: NoteSchema,
});
export type NoteUpdatedEvent = z.infer<typeof NoteUpdatedEventSchema>;

export const NoteDeletedEventSchema = z.object({
  type: z.literal('note_deleted'),
  noteId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  verseId: z.number().int().positive().nullable(),
});
export type NoteDeletedEvent = z.infer<typeof NoteDeletedEventSchema>;

export const SseEventSchema = z.discriminatedUnion('type', [
  ProgressEventSchema,
  NoteCreatedEventSchema,
  NoteUpdatedEventSchema,
  NoteDeletedEventSchema,
]);
export type SseEvent = z.infer<typeof SseEventSchema>;
