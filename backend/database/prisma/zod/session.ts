import * as z from "zod"

export const SessionSchemaGenerated = z.object({
  id: z.string(),
  sid: z.string(),
  data: z.string(),
  expiresAt: z.date(),
})
