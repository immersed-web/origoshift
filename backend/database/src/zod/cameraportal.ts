import * as z from "zod"
import { CompleteCamera, RelatedCameraSchemaGenerated } from "./index"

export const CameraPortalSchemaGenerated = z.object({
  fromCameraId: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string().uuid(),
})

export interface CompleteCameraPortal extends z.infer<typeof CameraPortalSchemaGenerated> {
  fromCamera: CompleteCamera
  toCamera: CompleteCamera
}

/**
 * RelatedCameraPortalSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedCameraPortalSchemaGenerated: z.ZodSchema<CompleteCameraPortal> = z.lazy(() => CameraPortalSchemaGenerated.extend({
  fromCamera: RelatedCameraSchemaGenerated,
  toCamera: RelatedCameraSchemaGenerated,
}))
