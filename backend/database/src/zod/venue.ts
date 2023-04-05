import * as z from "zod"
import { Visibility } from "@prisma/client"
import { CompleteVirtualSpace, RelatedVirtualSpaceSchemaGenerated, CompleteUser, RelatedUserSchemaGenerated, CompleteCamera, RelatedCameraSchemaGenerated } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const VenueSchemaGenerated = z.object({
  venueId: z.string().uuid(),
  name: z.string(),
  streamStartTime: z.date().nullish(),
  doorsOpeningTime: z.date().nullish(),
  extraSettings: jsonSchema,
  visibility: z.nativeEnum(Visibility),
})

export interface CompleteVenue extends z.infer<typeof VenueSchemaGenerated> {
  virtualSpace?: CompleteVirtualSpace | null
  owners: CompleteUser[]
  whitelistedUsers: CompleteUser[]
  blackListedUsers: CompleteUser[]
  cameras: CompleteCamera[]
}

/**
 * RelatedVenueSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedVenueSchemaGenerated: z.ZodSchema<CompleteVenue> = z.lazy(() => VenueSchemaGenerated.extend({
  virtualSpace: RelatedVirtualSpaceSchemaGenerated.nullish(),
  owners: RelatedUserSchemaGenerated.array(),
  whitelistedUsers: RelatedUserSchemaGenerated.array(),
  blackListedUsers: RelatedUserSchemaGenerated.array(),
  cameras: RelatedCameraSchemaGenerated.array(),
}))
