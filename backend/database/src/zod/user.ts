import * as z from "zod"
import { Role } from "@prisma/client"
import { CompleteVenue, RelatedVenueSchemaGenerated } from "./index"

export const UserSchemaGenerated = z.object({
  userId: z.string().uuid(),
  updatedAt: z.date(),
  username: z.string(),
  password: z.string(),
  role: z.nativeEnum(Role),
})

export interface CompleteUser extends z.infer<typeof UserSchemaGenerated> {
  ownedVenues: CompleteVenue[]
  allowedVenues: CompleteVenue[]
  bannedVenues: CompleteVenue[]
}

/**
 * RelatedUserSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserSchemaGenerated: z.ZodSchema<CompleteUser> = z.lazy(() => UserSchemaGenerated.extend({
  ownedVenues: RelatedVenueSchemaGenerated.array(),
  allowedVenues: RelatedVenueSchemaGenerated.array(),
  bannedVenues: RelatedVenueSchemaGenerated.array(),
}))
