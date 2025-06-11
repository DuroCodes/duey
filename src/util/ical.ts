import { z } from "zod/v4";

export const assignmentSchema = z.object({
  summary: z.string(),
  location: z.string(),
  description: z.string(),
  start: z.date(),
  end: z.date(),
  lastmodified: z.date(),
});
