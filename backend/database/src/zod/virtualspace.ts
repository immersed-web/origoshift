import * as z from "zod"
import { CompleteVenue, RelatedVenueSchemaGenerated, CompleteVirtualSpace3DModel, RelatedVirtualSpace3DModelSchemaGenerated } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const VirtualSpaceSchemaGenerated = z.object({
  vrId: z.string().uuid(),
  extraSettings: jsonSchema,
  ownerVenueId: z.string().uuid(),
  virtualSpace3DModelId: z.string().uuid().nullish(),
})

export interface CompleteVirtualSpace extends z.infer<typeof VirtualSpaceSchemaGenerated> {
  venue: CompleteVenue
  virtualSpace3DModel?: CompleteVirtualSpace3DModel | null
}

/**
 * RelatedVirtualSpaceSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedVirtualSpaceSchemaGenerated: z.ZodSchema<CompleteVirtualSpace> = z.lazy(() => VirtualSpaceSchemaGenerated.extend({
  venue: RelatedVenueSchemaGenerated,
  virtualSpace3DModel: RelatedVirtualSpace3DModelSchemaGenerated.nullish(),
}))
