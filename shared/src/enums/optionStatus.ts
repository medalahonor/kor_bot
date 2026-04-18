import { z } from 'zod';

export const OptionStatusSchema = z.enum([
  'available',
  'visited',
  'requirements_not_met',
  'closed',
]);

export type OptionStatus = z.infer<typeof OptionStatusSchema>;
