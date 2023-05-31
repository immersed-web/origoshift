import * as z from "zod"
import { CompleteVenue, RelatedVenueSchemaGenerated, CompleteCameraPortal, RelatedCameraPortalSchemaGenerated } from "./index"

// Helper schema for JSON fields
type Literal = boolean | number | string
type Json = Literal | { [key: string]: Json } | Json[]
const literalSchema = z.union([z.string(), z.number(), z.boolean()])
const jsonSchema: z.ZodSchema<Json> = z.lazy(() => z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]))

export const CameraSchemaGenerated = z.object({
  cameraId: z.string().uuid(),
  name: z.string(),
  venueId: z.string().uuid(),
  senderId: z.string().uuid().nullish(),
  startAngleX: z.number(),
  startAngleY: z.number(),
  settings: jsonSchema,
})

export interface CompleteCamera extends z.infer<typeof CameraSchemaGenerated> {
  venue: CompleteVenue
  cameraPortals: CompleteCameraPortal[]
  fromCameraPortals: CompleteCameraPortal[]
}

/**
 * RelatedCameraSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedCameraSchemaGenerated: z.ZodSchema<CompleteCamera> = z.lazy(() => CameraSchemaGenerated.extend({
  venue: RelatedVenueSchemaGenerated,
  cameraPortals: RelatedCameraPortalSchemaGenerated.array(),
  fromCameraPortals: RelatedCameraPortalSchemaGenerated.array(),
}))
