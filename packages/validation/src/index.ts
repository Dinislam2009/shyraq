import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(10000).nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).default('NONE'),
  dueAt: z.string().datetime().nullable().optional(),
  estimatedDuration: z.number().int().positive().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});
