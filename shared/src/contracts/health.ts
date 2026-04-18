import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const HealthContract = {
  response: { 200: HealthResponseSchema },
} as const;
