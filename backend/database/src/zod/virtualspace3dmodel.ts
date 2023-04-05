import * as z from "zod"
import { CompleteVirtualSpace, RelatedVirtualSpaceSchemaGenerated } from "./index"

export const VirtualSpace3DModelSchemaGenerated = z.object({
  modelId: z.string().uuid(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean(),
  scale: z.number(),
})

export interface CompleteVirtualSpace3DModel extends z.infer<typeof VirtualSpace3DModelSchemaGenerated> {
  virtualSpaces: CompleteVirtualSpace[]
}

/**
 * RelatedVirtualSpace3DModelSchemaGenerated contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedVirtualSpace3DModelSchemaGenerated: z.ZodSchema<CompleteVirtualSpace3DModel> = z.lazy(() => VirtualSpace3DModelSchemaGenerated.extend({
  virtualSpaces: RelatedVirtualSpaceSchemaGenerated.array(),
}))
