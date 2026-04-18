import { z } from 'zod';
import { OptionStatusSchema } from '../enums/optionStatus.js';

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

export const SseEventSchema = z.discriminatedUnion('type', [ProgressEventSchema]);
export type SseEvent = z.infer<typeof SseEventSchema>;
