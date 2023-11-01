import { z } from 'zod';
import type { JwtPayload as JwtShapeFromLib } from 'jsonwebtoken'
import { Role, Venue, VirtualSpace3DModel, Visibility, Camera, CameraType as PrismaCameraType } from "database";
import { toZod } from "tozod";

type RemoveIndex<T> = {
  [ K in keyof T as string extends K ? never : number extends K ? never : K ] : T[K]
};

type JWTDefaultPayload = RemoveIndex<JwtShapeFromLib>

// type Implements<Model> = {
//   [key in keyof Model]-?: undefined extends Model[key]
//     ? null extends Model[key]
//       ? z.ZodNullableType<z.ZodOptionalType<z.ZodType<Model[key]>>>
//       : z.ZodOptionalType<z.ZodType<Model[key]>>
//     : null extends Model[key]
//     ? z.ZodNullableType<z.ZodType<Model[key]>>
//     : z.ZodType<Model[key]>;
// };

// function implement<Model = never>() {
//   return {
//     with: <
//       Schema extends Implements<Model> & {
//         [unknownKey in Exclude<keyof Schema, keyof Model>]: never;
//       }
//     >(
//       schema: Schema
//     ) => z.object(schema),
//   };
// }

// const jwtDefaultPayload = implement<JWTDefaultPayload>().with({
//   aud: z.string().optional(),
//   exp: z.number().optional(),
//   iat: z.number().optional(),
//   iss: z.string().optional(),
//   jti: z.string().optional(),
//   nbf: z.number().optional(),
//   sub: z.string().optional(),
// })

const jwtDefaultPayload: toZod<JWTDefaultPayload> = z.object({
  aud: z.string().optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
  iss: z.string().optional(),
  jti: z.string().optional(),
  nbf: z.number().optional(),
  sub: z.string().optional(),
})

// TODO: I would really prefer to infer a const literal tuple from the prisma enum.
// That is. Could we in some way convert/extract a literal tuple from the prisma type and then use z.enum() on it directly
// Then we could use that extracted literal tuple from prisma instead of defining it manually here. This is redundant and we need to keep them in sync
export const roleHierarchy = (['gunnar', 'superadmin', 'admin', 'moderator', 'sender', 'user', 'guest'] as const) satisfies Readonly<Role[]>;

export function throwIfUnauthorized(role: UserRole, minimumUserRole: UserRole) {
  if(!hasAtLeastSecurityLevel(role, minimumUserRole)){
    throw new Error('Unauthorized! You fool!');
  }
}

export function hasAtLeastSecurityLevel(role: UserRole | undefined, minimumUserRole: UserRole) {
  if(!role){
    // return false;
    throw new Error('no userRole provided for auth check!');
  }
  if(!minimumUserRole) {
    throw new Error('no minimum userRole provided for auth check!');
  }
  const clientSecurityLevel = roleHierarchy.indexOf(role);
  if(clientSecurityLevel < 0) throw Error('invalid role provided');
  const minimumRoleLevel = roleHierarchy.indexOf(minimumUserRole);
  if(minimumRoleLevel < 0) throw Error('invalid minimum role provided');

  return clientSecurityLevel <= minimumRoleLevel
}

// type RoleSet = Set<Role>;
// const roles: Set<Role> = new Set(['gunnar', 'superadmin', 'admin', 'moderator', 'user', 'guest']);
// const arr = Array.from(roles);
// type RoleEnumToZod = toZod<EnumFromRoleUnion>

// type EnumFromRoleUnion = {
//   [k in Role]: k
// };

// const zodifiedRoleEnun: toZod<EnumFromRoleUnion> = z.object({
//   gunnar: z.literal('gunnar'),
//   superadmin: z.literal('superadmin'),
//   admin: z.literal('admin'),
//   moderator: z.literal('moderator'),
//   user: z.literal('user'),
//   guest: z.literal('guest'),
// });

// type InferredRole = z.TypeOf<typeof zodifiedRoleEnun>;
//
// const UserRoleSchema = z.enum(possibleUserRoles);
export const UserRoleSchema = z.enum(roleHierarchy);
export type UserRole = z.TypeOf<typeof UserRoleSchema>;

export type { Visibility } from 'database'

//Here we are creating Opaque type for the different types of id's. This is to prevent acidentally using ids for the wrong type of object.
export const UuidSchema = z.string().uuid();
export type Uuid = z.TypeOf<typeof UuidSchema>;

export const ConnectionIdSchema = UuidSchema.brand<'ConnectionId'>();
export type ConnectionId = z.TypeOf<typeof ConnectionIdSchema>;

export const UserIdSchema = UuidSchema.brand<'UserId'>();
export type UserId = z.TypeOf<typeof UserIdSchema>;

export const VenueIdSchema = UuidSchema.brand<'VenueId'>();
export type VenueId = z.TypeOf<typeof VenueIdSchema>;

export const VrSpaceIdSchema = UuidSchema.brand<'VrSpaceId'>();
// export type VrSpaceId = z.TypeOf<typeof VrSpaceIdSchema>;
export type VrSpaceId = z.TypeOf<typeof VrSpaceIdSchema>;

export const Vr3DModelIdSchema = UuidSchema.brand<'Vr3DModelId'>();
export type Vr3DModelId = z.TypeOf<typeof Vr3DModelIdSchema>;

export const SenderIdSchema = UuidSchema.brand<'SenderId'>();
export type SenderId = z.TypeOf<typeof SenderIdSchema>;

//TODO: Find out why zod complains about infer not existing. Because of that we cant use zod-prisma :-(
// import { VenueSchemaGenerated } from 'database'
// export const VenueUpdateSchema = VenueSchemaGenerated.pick({
//   name: true,
//   doorsOpeningTime: true,
//   streamStartTime: true,
// })


export type VenueListInfo = {venueId: VenueId } & Pick<Venue, 'name' | 'doorsOpeningTime' | 'streamStartTime' | 'visibility'>

export const visibilityOptions = ['private', 'unlisted', 'public'] as const satisfies Readonly<Visibility[]>
const VisibilitySchema = z.enum(visibilityOptions);

// TODO: Make it unsatisfied when using fields that don't exist in Venue
export const VenueUpdateSchema = z.object({
  name: z.string().nonempty().optional(),
  visibility: VisibilitySchema.optional(),
  doorsOpeningTime: z.date().nullable().optional(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.date().nullable().optional(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
}) satisfies z.ZodType<Partial<Venue>>
export type VenueUpdate = z.TypeOf<typeof VenueUpdateSchema>;

export const VirtualSpace3DModelCreateSchema = z.object({
  modelUrl: z.string()
}) satisfies z.ZodType<Partial<VirtualSpace3DModel>>
export type VirtualSpace3DCreate = z.TypeOf<typeof VirtualSpace3DModelCreateSchema>

export const VirtualSpace3DModelRemoveSchema = z.object({
  modelId: Vr3DModelIdSchema
})
export type VirtualSpace3DRemove = z.TypeOf<typeof VirtualSpace3DModelRemoveSchema>

export const VirtualSpace3DModelUpdateSchema = z.object({
  modelId: Vr3DModelIdSchema,
  scale: z.number().optional()
})
export type VirtualSpace3DModelUpdate = z.TypeOf<typeof VirtualSpace3DModelRemoveSchema>

export const CameraIdSchema = UuidSchema.brand<'CameraId'>();
export type CameraId = z.TypeOf<typeof CameraIdSchema>;

export const CameraPortalUpdateSchema = z.object({
      cameraId: CameraIdSchema,
      toCameraId: CameraIdSchema,
      portal: z.object({
        x: z.number(),
        y: z.number(),
        distance: z.number(),
      })
    });
export type CameraPortalUpdate = z.TypeOf<typeof CameraPortalUpdateSchema>

// const cameraTypeOptions = ['panoramic360', 'normal'] as const satisfies Readonly<PrismaCameraType[]>
// const CameraTypeSchema = z.enum(cameraTypeOptions);
// export type CameraType = z.TypeOf<typeof CameraTypeSchema>
// export const CameraTypeUpdateSchema = z.object({
//   cameraId: CameraIdSchema,
//   cameraType: CameraTypeSchema,
// })
// export type CameraTypeUpdate = z.TypeOf<typeof CameraTypeUpdateSchema>;

type CameraUpdatePayload = Partial<Pick<Camera,
  'name'
  | 'fovStart'
  | 'fovEnd'
  | 'cameraType'
  | 'orientation'
  | 'viewOriginX'
  | 'viewOriginY'
  | 'settings'
  >>;
export const CameraUpdateSchema = z.object({
  cameraId: CameraIdSchema,
  data: z.object({
    name: z.string().optional(),
    cameraType: z.enum(['panoramic360', 'normal']).optional(),
    viewOriginX: z.number().optional(),
    viewOriginY: z.number().optional(),
    fovStart: z.number().optional(),
    fovEnd: z.number().optional(),
    orientation: z.number().optional(),
    settings: z.object({}).passthrough().optional(),
  }) satisfies z.ZodType<CameraUpdatePayload>,
  reason: z.string().optional(),
});
export type CameraUpdate = z.TypeOf<typeof CameraUpdateSchema>

export const CameraFOVUpdateSchema = z.object({
  cameraId: CameraIdSchema,
  FOV: z.object({fovStart: z.number(), fovEnd: z.number()})
})
export type CameraFOVUpdate = z.TypeOf<typeof CameraFOVUpdateSchema>;

export const JwtUserDataSchema = z.object({
  userId: UserIdSchema,
  username: z.string(),
  role: UserRoleSchema,
})
export type JwtUserData = z.TypeOf<typeof JwtUserDataSchema>;

export const JwtPayloadSchema = jwtDefaultPayload.merge(JwtUserDataSchema)
export type JwtPayload = z.TypeOf<typeof JwtPayloadSchema>;

export const ClientTransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  orientation: z.tuple([z.number(), z.number(), z.number(), z.number()])
})

export type ClientTransform = z.TypeOf<typeof ClientTransformSchema>;

export type ClientTransforms = Record<ConnectionId, ClientTransform>;

export const ClientInfoSchema = z.object({
  userId: UserIdSchema,
  role: UserRoleSchema,
  position: z.optional(ClientTransformSchema)
})

export type ClientInfo = z.TypeOf<typeof ClientInfoSchema>;

export const ClientTypeSchema = z.union([z.literal('client'), z.literal('sender')]);
export type ClientType = z.TypeOf<typeof ClientTypeSchema>;
