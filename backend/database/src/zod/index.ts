import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValue: z.ZodType<Prisma.JsonValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.lazy(() => z.array(JsonValue)),
  z.lazy(() => z.record(JsonValue)),
]);

export type JsonValueType = z.infer<typeof JsonValue>;

export const NullableJsonValue = z
  .union([JsonValue, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValue: z.ZodType<Prisma.InputJsonValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.lazy(() => z.array(InputJsonValue.nullable())),
  z.lazy(() => z.record(InputJsonValue.nullable())),
]);

export type InputJsonValueType = z.infer<typeof InputJsonValue>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const CameraPortalScalarFieldEnumSchema = z.enum(['fromCameraId','x','y','distance','toCameraId']);

export const CameraScalarFieldEnumSchema = z.enum(['cameraId','name','venueId','senderId','cameraType','viewOriginX','viewOriginY','fovStart','fovEnd','orientation','settings']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((v) => transformJsonNull(v));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const SessionScalarFieldEnumSchema = z.enum(['id','sid','data','expiresAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['userId','updatedAt','username','password','role']);

export const VenueScalarFieldEnumSchema = z.enum(['venueId','name','doorsOpeningTime','doorsAutoOpen','doorsManuallyOpened','streamStartTime','streamAutoStart','streamManuallyStarted','streamManuallyEnded','extraSettings','visibility']);

export const VirtualSpace3DModelScalarFieldEnumSchema = z.enum(['modelId','modelUrl','navmeshUrl','public','scale']);

export const VirtualSpaceScalarFieldEnumSchema = z.enum(['vrId','extraSettings','ownerVenueId','virtualSpace3DModelId']);

export const RoleSchema = z.enum(['gunnar','superadmin','admin','moderator','sender','user','guest']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export const VisibilitySchema = z.enum(['private','unlisted','public']);

export type VisibilityType = `${z.infer<typeof VisibilitySchema>}`

export const CameraTypeSchema = z.enum(['panoramic360','normal']);

export type CameraTypeType = `${z.infer<typeof CameraTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  sid: z.string(),
  data: z.string(),
  expiresAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: RoleSchema,
  userId: z.string(),
  updatedAt: z.coerce.date(),
  username: z.string(),
  password: z.string(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// VENUE SCHEMA
/////////////////////////////////////////

export const VenueSchema = z.object({
  visibility: VisibilitySchema,
  venueId: z.string(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().nullable(),
  doorsAutoOpen: z.boolean(),
  doorsManuallyOpened: z.boolean(),
  streamStartTime: z.coerce.date().nullable(),
  streamAutoStart: z.boolean(),
  streamManuallyStarted: z.boolean(),
  streamManuallyEnded: z.boolean(),
  extraSettings: NullableJsonValue.optional(),
})

export type Venue = z.infer<typeof VenueSchema>

/////////////////////////////////////////
// VIRTUAL SPACE SCHEMA
/////////////////////////////////////////

export const VirtualSpaceSchema = z.object({
  vrId: z.string(),
  extraSettings: NullableJsonValue.optional(),
  ownerVenueId: z.string(),
  virtualSpace3DModelId: z.string().nullable(),
})

export type VirtualSpace = z.infer<typeof VirtualSpaceSchema>

/////////////////////////////////////////
// VIRTUAL SPACE 3 D MODEL SCHEMA
/////////////////////////////////////////

export const VirtualSpace3DModelSchema = z.object({
  modelId: z.string(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean(),
  scale: z.number(),
})

export type VirtualSpace3DModel = z.infer<typeof VirtualSpace3DModelSchema>

/////////////////////////////////////////
// CAMERA SCHEMA
/////////////////////////////////////////

export const CameraSchema = z.object({
  cameraType: CameraTypeSchema,
  cameraId: z.string(),
  name: z.string(),
  venueId: z.string(),
  senderId: z.string().nullable(),
  viewOriginX: z.number(),
  viewOriginY: z.number(),
  fovStart: z.number(),
  fovEnd: z.number(),
  orientation: z.number(),
  settings: NullableJsonValue.optional(),
})

export type Camera = z.infer<typeof CameraSchema>

/////////////////////////////////////////
// CAMERA PORTAL SCHEMA
/////////////////////////////////////////

export const CameraPortalSchema = z.object({
  fromCameraId: z.string(),
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string(),
})

export type CameraPortal = z.infer<typeof CameraPortalSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// SESSION
//------------------------------------------------------

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z.object({
  id: z.boolean().optional(),
  sid: z.boolean().optional(),
  data: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
}).strict()

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  ownedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  allowedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  bannedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  ownedVenues: z.boolean().optional(),
  allowedVenues: z.boolean().optional(),
  bannedVenues: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  userId: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  username: z.boolean().optional(),
  password: z.boolean().optional(),
  role: z.boolean().optional(),
  ownedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  allowedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  bannedVenues: z.union([z.boolean(),z.lazy(() => VenueFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// VENUE
//------------------------------------------------------

export const VenueIncludeSchema: z.ZodType<Prisma.VenueInclude> = z.object({
  virtualSpace: z.union([z.boolean(),z.lazy(() => VirtualSpaceArgsSchema)]).optional(),
  owners: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  whitelistedUsers: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  blackListedUsers: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  cameras: z.union([z.boolean(),z.lazy(() => CameraFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => VenueCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const VenueArgsSchema: z.ZodType<Prisma.VenueDefaultArgs> = z.object({
  select: z.lazy(() => VenueSelectSchema).optional(),
  include: z.lazy(() => VenueIncludeSchema).optional(),
}).strict();

export const VenueCountOutputTypeArgsSchema: z.ZodType<Prisma.VenueCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => VenueCountOutputTypeSelectSchema).nullish(),
}).strict();

export const VenueCountOutputTypeSelectSchema: z.ZodType<Prisma.VenueCountOutputTypeSelect> = z.object({
  owners: z.boolean().optional(),
  whitelistedUsers: z.boolean().optional(),
  blackListedUsers: z.boolean().optional(),
  cameras: z.boolean().optional(),
}).strict();

export const VenueSelectSchema: z.ZodType<Prisma.VenueSelect> = z.object({
  venueId: z.boolean().optional(),
  name: z.boolean().optional(),
  doorsOpeningTime: z.boolean().optional(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.boolean().optional(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.boolean().optional(),
  virtualSpace: z.union([z.boolean(),z.lazy(() => VirtualSpaceArgsSchema)]).optional(),
  visibility: z.boolean().optional(),
  owners: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  whitelistedUsers: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  blackListedUsers: z.union([z.boolean(),z.lazy(() => UserFindManyArgsSchema)]).optional(),
  cameras: z.union([z.boolean(),z.lazy(() => CameraFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => VenueCountOutputTypeArgsSchema)]).optional(),
}).strict()

// VIRTUAL SPACE
//------------------------------------------------------

export const VirtualSpaceIncludeSchema: z.ZodType<Prisma.VirtualSpaceInclude> = z.object({
  venue: z.union([z.boolean(),z.lazy(() => VenueArgsSchema)]).optional(),
  virtualSpace3DModel: z.union([z.boolean(),z.lazy(() => VirtualSpace3DModelArgsSchema)]).optional(),
}).strict()

export const VirtualSpaceArgsSchema: z.ZodType<Prisma.VirtualSpaceDefaultArgs> = z.object({
  select: z.lazy(() => VirtualSpaceSelectSchema).optional(),
  include: z.lazy(() => VirtualSpaceIncludeSchema).optional(),
}).strict();

export const VirtualSpaceSelectSchema: z.ZodType<Prisma.VirtualSpaceSelect> = z.object({
  vrId: z.boolean().optional(),
  extraSettings: z.boolean().optional(),
  venue: z.union([z.boolean(),z.lazy(() => VenueArgsSchema)]).optional(),
  ownerVenueId: z.boolean().optional(),
  virtualSpace3DModel: z.union([z.boolean(),z.lazy(() => VirtualSpace3DModelArgsSchema)]).optional(),
  virtualSpace3DModelId: z.boolean().optional(),
}).strict()

// VIRTUAL SPACE 3 D MODEL
//------------------------------------------------------

export const VirtualSpace3DModelIncludeSchema: z.ZodType<Prisma.VirtualSpace3DModelInclude> = z.object({
  virtualSpaces: z.union([z.boolean(),z.lazy(() => VirtualSpaceFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => VirtualSpace3DModelCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const VirtualSpace3DModelArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelDefaultArgs> = z.object({
  select: z.lazy(() => VirtualSpace3DModelSelectSchema).optional(),
  include: z.lazy(() => VirtualSpace3DModelIncludeSchema).optional(),
}).strict();

export const VirtualSpace3DModelCountOutputTypeArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => VirtualSpace3DModelCountOutputTypeSelectSchema).nullish(),
}).strict();

export const VirtualSpace3DModelCountOutputTypeSelectSchema: z.ZodType<Prisma.VirtualSpace3DModelCountOutputTypeSelect> = z.object({
  virtualSpaces: z.boolean().optional(),
}).strict();

export const VirtualSpace3DModelSelectSchema: z.ZodType<Prisma.VirtualSpace3DModelSelect> = z.object({
  modelId: z.boolean().optional(),
  modelUrl: z.boolean().optional(),
  navmeshUrl: z.boolean().optional(),
  public: z.boolean().optional(),
  scale: z.boolean().optional(),
  virtualSpaces: z.union([z.boolean(),z.lazy(() => VirtualSpaceFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => VirtualSpace3DModelCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CAMERA
//------------------------------------------------------

export const CameraIncludeSchema: z.ZodType<Prisma.CameraInclude> = z.object({
  venue: z.union([z.boolean(),z.lazy(() => VenueArgsSchema)]).optional(),
  cameraPortals: z.union([z.boolean(),z.lazy(() => CameraPortalFindManyArgsSchema)]).optional(),
  fromCameraPortals: z.union([z.boolean(),z.lazy(() => CameraPortalFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CameraCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const CameraArgsSchema: z.ZodType<Prisma.CameraDefaultArgs> = z.object({
  select: z.lazy(() => CameraSelectSchema).optional(),
  include: z.lazy(() => CameraIncludeSchema).optional(),
}).strict();

export const CameraCountOutputTypeArgsSchema: z.ZodType<Prisma.CameraCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CameraCountOutputTypeSelectSchema).nullish(),
}).strict();

export const CameraCountOutputTypeSelectSchema: z.ZodType<Prisma.CameraCountOutputTypeSelect> = z.object({
  cameraPortals: z.boolean().optional(),
  fromCameraPortals: z.boolean().optional(),
}).strict();

export const CameraSelectSchema: z.ZodType<Prisma.CameraSelect> = z.object({
  cameraId: z.boolean().optional(),
  name: z.boolean().optional(),
  venue: z.union([z.boolean(),z.lazy(() => VenueArgsSchema)]).optional(),
  venueId: z.boolean().optional(),
  senderId: z.boolean().optional(),
  cameraType: z.boolean().optional(),
  viewOriginX: z.boolean().optional(),
  viewOriginY: z.boolean().optional(),
  fovStart: z.boolean().optional(),
  fovEnd: z.boolean().optional(),
  orientation: z.boolean().optional(),
  settings: z.boolean().optional(),
  cameraPortals: z.union([z.boolean(),z.lazy(() => CameraPortalFindManyArgsSchema)]).optional(),
  fromCameraPortals: z.union([z.boolean(),z.lazy(() => CameraPortalFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => CameraCountOutputTypeArgsSchema)]).optional(),
}).strict()

// CAMERA PORTAL
//------------------------------------------------------

export const CameraPortalIncludeSchema: z.ZodType<Prisma.CameraPortalInclude> = z.object({
  fromCamera: z.union([z.boolean(),z.lazy(() => CameraArgsSchema)]).optional(),
  toCamera: z.union([z.boolean(),z.lazy(() => CameraArgsSchema)]).optional(),
}).strict()

export const CameraPortalArgsSchema: z.ZodType<Prisma.CameraPortalDefaultArgs> = z.object({
  select: z.lazy(() => CameraPortalSelectSchema).optional(),
  include: z.lazy(() => CameraPortalIncludeSchema).optional(),
}).strict();

export const CameraPortalSelectSchema: z.ZodType<Prisma.CameraPortalSelect> = z.object({
  fromCamera: z.union([z.boolean(),z.lazy(() => CameraArgsSchema)]).optional(),
  fromCameraId: z.boolean().optional(),
  x: z.boolean().optional(),
  y: z.boolean().optional(),
  distance: z.boolean().optional(),
  toCamera: z.union([z.boolean(),z.lazy(() => CameraArgsSchema)]).optional(),
  toCameraId: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const SessionWhereInputSchema: z.ZodType<Prisma.SessionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SessionWhereInputSchema),z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionWhereInputSchema),z.lazy(() => SessionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  sid: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  data: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const SessionOrderByWithRelationInputSchema: z.ZodType<Prisma.SessionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  sid: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SessionWhereUniqueInputSchema: z.ZodType<Prisma.SessionWhereUniqueInput> = z.object({
  id: z.string().optional(),
  sid: z.string().optional()
}).strict();

export const SessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SessionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  sid: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SessionCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SessionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SessionMinOrderByAggregateInputSchema).optional()
}).strict();

export const SessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SessionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema),z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SessionScalarWhereWithAggregatesInputSchema),z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  sid: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  data: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  username: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueListRelationFilterSchema).optional(),
  allowedVenues: z.lazy(() => VenueListRelationFilterSchema).optional(),
  bannedVenues: z.lazy(() => VenueListRelationFilterSchema).optional()
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  userId: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  ownedVenues: z.lazy(() => VenueOrderByRelationAggregateInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueOrderByRelationAggregateInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueOrderByRelationAggregateInputSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.object({
  userId: z.string().optional(),
  username: z.string().optional()
}).strict();

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  userId: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  username: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
}).strict();

export const VenueWhereInputSchema: z.ZodType<Prisma.VenueWhereInput> = z.object({
  AND: z.union([ z.lazy(() => VenueWhereInputSchema),z.lazy(() => VenueWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VenueWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VenueWhereInputSchema),z.lazy(() => VenueWhereInputSchema).array() ]).optional(),
  venueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  doorsOpeningTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  doorsManuallyOpened: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamStartTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  streamAutoStart: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamManuallyStarted: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamManuallyEnded: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableFilterSchema).optional(),
  virtualSpace: z.union([ z.lazy(() => VirtualSpaceRelationFilterSchema),z.lazy(() => VirtualSpaceWhereInputSchema) ]).optional().nullable(),
  visibility: z.union([ z.lazy(() => EnumVisibilityFilterSchema),z.lazy(() => VisibilitySchema) ]).optional(),
  owners: z.lazy(() => UserListRelationFilterSchema).optional(),
  whitelistedUsers: z.lazy(() => UserListRelationFilterSchema).optional(),
  blackListedUsers: z.lazy(() => UserListRelationFilterSchema).optional(),
  cameras: z.lazy(() => CameraListRelationFilterSchema).optional()
}).strict();

export const VenueOrderByWithRelationInputSchema: z.ZodType<Prisma.VenueOrderByWithRelationInput> = z.object({
  venueId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  doorsOpeningTime: z.lazy(() => SortOrderSchema).optional(),
  doorsAutoOpen: z.lazy(() => SortOrderSchema).optional(),
  doorsManuallyOpened: z.lazy(() => SortOrderSchema).optional(),
  streamStartTime: z.lazy(() => SortOrderSchema).optional(),
  streamAutoStart: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyStarted: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyEnded: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceOrderByWithRelationInputSchema).optional(),
  visibility: z.lazy(() => SortOrderSchema).optional(),
  owners: z.lazy(() => UserOrderByRelationAggregateInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserOrderByRelationAggregateInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserOrderByRelationAggregateInputSchema).optional(),
  cameras: z.lazy(() => CameraOrderByRelationAggregateInputSchema).optional()
}).strict();

export const VenueWhereUniqueInputSchema: z.ZodType<Prisma.VenueWhereUniqueInput> = z.object({
  venueId: z.string().optional(),
  name: z.string().optional()
}).strict();

export const VenueOrderByWithAggregationInputSchema: z.ZodType<Prisma.VenueOrderByWithAggregationInput> = z.object({
  venueId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  doorsOpeningTime: z.lazy(() => SortOrderSchema).optional(),
  doorsAutoOpen: z.lazy(() => SortOrderSchema).optional(),
  doorsManuallyOpened: z.lazy(() => SortOrderSchema).optional(),
  streamStartTime: z.lazy(() => SortOrderSchema).optional(),
  streamAutoStart: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyStarted: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyEnded: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  visibility: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => VenueCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VenueMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VenueMinOrderByAggregateInputSchema).optional()
}).strict();

export const VenueScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VenueScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => VenueScalarWhereWithAggregatesInputSchema),z.lazy(() => VenueScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VenueScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VenueScalarWhereWithAggregatesInputSchema),z.lazy(() => VenueScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  venueId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  doorsOpeningTime: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  doorsManuallyOpened: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  streamStartTime: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  streamAutoStart: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  streamManuallyStarted: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  streamManuallyEnded: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  visibility: z.union([ z.lazy(() => EnumVisibilityWithAggregatesFilterSchema),z.lazy(() => VisibilitySchema) ]).optional(),
}).strict();

export const VirtualSpaceWhereInputSchema: z.ZodType<Prisma.VirtualSpaceWhereInput> = z.object({
  AND: z.union([ z.lazy(() => VirtualSpaceWhereInputSchema),z.lazy(() => VirtualSpaceWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VirtualSpaceWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VirtualSpaceWhereInputSchema),z.lazy(() => VirtualSpaceWhereInputSchema).array() ]).optional(),
  vrId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableFilterSchema).optional(),
  venue: z.union([ z.lazy(() => VenueRelationFilterSchema),z.lazy(() => VenueWhereInputSchema) ]).optional(),
  ownerVenueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  virtualSpace3DModel: z.union([ z.lazy(() => VirtualSpace3DModelRelationFilterSchema),z.lazy(() => VirtualSpace3DModelWhereInputSchema) ]).optional().nullable(),
  virtualSpace3DModelId: z.union([ z.lazy(() => UuidNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const VirtualSpaceOrderByWithRelationInputSchema: z.ZodType<Prisma.VirtualSpaceOrderByWithRelationInput> = z.object({
  vrId: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  venue: z.lazy(() => VenueOrderByWithRelationInputSchema).optional(),
  ownerVenueId: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace3DModel: z.lazy(() => VirtualSpace3DModelOrderByWithRelationInputSchema).optional(),
  virtualSpace3DModelId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpaceWhereUniqueInputSchema: z.ZodType<Prisma.VirtualSpaceWhereUniqueInput> = z.object({
  vrId: z.string().optional(),
  ownerVenueId: z.string().optional()
}).strict();

export const VirtualSpaceOrderByWithAggregationInputSchema: z.ZodType<Prisma.VirtualSpaceOrderByWithAggregationInput> = z.object({
  vrId: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  ownerVenueId: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace3DModelId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => VirtualSpaceCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VirtualSpaceMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VirtualSpaceMinOrderByAggregateInputSchema).optional()
}).strict();

export const VirtualSpaceScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VirtualSpaceScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => VirtualSpaceScalarWhereWithAggregatesInputSchema),z.lazy(() => VirtualSpaceScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VirtualSpaceScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VirtualSpaceScalarWhereWithAggregatesInputSchema),z.lazy(() => VirtualSpaceScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  vrId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  ownerVenueId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  virtualSpace3DModelId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const VirtualSpace3DModelWhereInputSchema: z.ZodType<Prisma.VirtualSpace3DModelWhereInput> = z.object({
  AND: z.union([ z.lazy(() => VirtualSpace3DModelWhereInputSchema),z.lazy(() => VirtualSpace3DModelWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VirtualSpace3DModelWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VirtualSpace3DModelWhereInputSchema),z.lazy(() => VirtualSpace3DModelWhereInputSchema).array() ]).optional(),
  modelId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  modelUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  navmeshUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  public: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  scale: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  virtualSpaces: z.lazy(() => VirtualSpaceListRelationFilterSchema).optional()
}).strict();

export const VirtualSpace3DModelOrderByWithRelationInputSchema: z.ZodType<Prisma.VirtualSpace3DModelOrderByWithRelationInput> = z.object({
  modelId: z.lazy(() => SortOrderSchema).optional(),
  modelUrl: z.lazy(() => SortOrderSchema).optional(),
  navmeshUrl: z.lazy(() => SortOrderSchema).optional(),
  public: z.lazy(() => SortOrderSchema).optional(),
  scale: z.lazy(() => SortOrderSchema).optional(),
  virtualSpaces: z.lazy(() => VirtualSpaceOrderByRelationAggregateInputSchema).optional()
}).strict();

export const VirtualSpace3DModelWhereUniqueInputSchema: z.ZodType<Prisma.VirtualSpace3DModelWhereUniqueInput> = z.object({
  modelId: z.string().optional()
}).strict();

export const VirtualSpace3DModelOrderByWithAggregationInputSchema: z.ZodType<Prisma.VirtualSpace3DModelOrderByWithAggregationInput> = z.object({
  modelId: z.lazy(() => SortOrderSchema).optional(),
  modelUrl: z.lazy(() => SortOrderSchema).optional(),
  navmeshUrl: z.lazy(() => SortOrderSchema).optional(),
  public: z.lazy(() => SortOrderSchema).optional(),
  scale: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => VirtualSpace3DModelCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => VirtualSpace3DModelAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => VirtualSpace3DModelMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => VirtualSpace3DModelMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => VirtualSpace3DModelSumOrderByAggregateInputSchema).optional()
}).strict();

export const VirtualSpace3DModelScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => VirtualSpace3DModelScalarWhereWithAggregatesInputSchema),z.lazy(() => VirtualSpace3DModelScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => VirtualSpace3DModelScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VirtualSpace3DModelScalarWhereWithAggregatesInputSchema),z.lazy(() => VirtualSpace3DModelScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  modelId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  modelUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  navmeshUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  public: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  scale: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
}).strict();

export const CameraWhereInputSchema: z.ZodType<Prisma.CameraWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CameraWhereInputSchema),z.lazy(() => CameraWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraWhereInputSchema),z.lazy(() => CameraWhereInputSchema).array() ]).optional(),
  cameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  venue: z.union([ z.lazy(() => VenueRelationFilterSchema),z.lazy(() => VenueWhereInputSchema) ]).optional(),
  venueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  senderId: z.union([ z.lazy(() => UuidNullableFilterSchema),z.string() ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => EnumCameraTypeFilterSchema),z.lazy(() => CameraTypeSchema) ]).optional(),
  viewOriginX: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  viewOriginY: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fovStart: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fovEnd: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  orientation: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableFilterSchema).optional(),
  cameraPortals: z.lazy(() => CameraPortalListRelationFilterSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalListRelationFilterSchema).optional()
}).strict();

export const CameraOrderByWithRelationInputSchema: z.ZodType<Prisma.CameraOrderByWithRelationInput> = z.object({
  cameraId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  venue: z.lazy(() => VenueOrderByWithRelationInputSchema).optional(),
  venueId: z.lazy(() => SortOrderSchema).optional(),
  senderId: z.lazy(() => SortOrderSchema).optional(),
  cameraType: z.lazy(() => SortOrderSchema).optional(),
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional(),
  settings: z.lazy(() => SortOrderSchema).optional(),
  cameraPortals: z.lazy(() => CameraPortalOrderByRelationAggregateInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalOrderByRelationAggregateInputSchema).optional()
}).strict();

export const CameraWhereUniqueInputSchema: z.ZodType<Prisma.CameraWhereUniqueInput> = z.object({
  cameraId: z.string().optional(),
  name_venueId: z.lazy(() => CameraNameVenueIdCompoundUniqueInputSchema).optional(),
  senderId_venueId: z.lazy(() => CameraSenderIdVenueIdCompoundUniqueInputSchema).optional()
}).strict();

export const CameraOrderByWithAggregationInputSchema: z.ZodType<Prisma.CameraOrderByWithAggregationInput> = z.object({
  cameraId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  venueId: z.lazy(() => SortOrderSchema).optional(),
  senderId: z.lazy(() => SortOrderSchema).optional(),
  cameraType: z.lazy(() => SortOrderSchema).optional(),
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional(),
  settings: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CameraCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CameraAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CameraMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CameraMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CameraSumOrderByAggregateInputSchema).optional()
}).strict();

export const CameraScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CameraScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CameraScalarWhereWithAggregatesInputSchema),z.lazy(() => CameraScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraScalarWhereWithAggregatesInputSchema),z.lazy(() => CameraScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  cameraId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  venueId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  senderId: z.union([ z.lazy(() => UuidNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => EnumCameraTypeWithAggregatesFilterSchema),z.lazy(() => CameraTypeSchema) ]).optional(),
  viewOriginX: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  viewOriginY: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  fovStart: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  fovEnd: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  orientation: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional()
}).strict();

export const CameraPortalWhereInputSchema: z.ZodType<Prisma.CameraPortalWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CameraPortalWhereInputSchema),z.lazy(() => CameraPortalWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraPortalWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraPortalWhereInputSchema),z.lazy(() => CameraPortalWhereInputSchema).array() ]).optional(),
  fromCamera: z.union([ z.lazy(() => CameraRelationFilterSchema),z.lazy(() => CameraWhereInputSchema) ]).optional(),
  fromCameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  y: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  distance: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  toCamera: z.union([ z.lazy(() => CameraRelationFilterSchema),z.lazy(() => CameraWhereInputSchema) ]).optional(),
  toCameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
}).strict();

export const CameraPortalOrderByWithRelationInputSchema: z.ZodType<Prisma.CameraPortalOrderByWithRelationInput> = z.object({
  fromCamera: z.lazy(() => CameraOrderByWithRelationInputSchema).optional(),
  fromCameraId: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional(),
  toCamera: z.lazy(() => CameraOrderByWithRelationInputSchema).optional(),
  toCameraId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraPortalWhereUniqueInputSchema: z.ZodType<Prisma.CameraPortalWhereUniqueInput> = z.object({
  fromCameraId_toCameraId: z.lazy(() => CameraPortalFromCameraIdToCameraIdCompoundUniqueInputSchema).optional()
}).strict();

export const CameraPortalOrderByWithAggregationInputSchema: z.ZodType<Prisma.CameraPortalOrderByWithAggregationInput> = z.object({
  fromCameraId: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional(),
  toCameraId: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => CameraPortalCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => CameraPortalAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => CameraPortalMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => CameraPortalMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => CameraPortalSumOrderByAggregateInputSchema).optional()
}).strict();

export const CameraPortalScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.CameraPortalScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => CameraPortalScalarWhereWithAggregatesInputSchema),z.lazy(() => CameraPortalScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraPortalScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraPortalScalarWhereWithAggregatesInputSchema),z.lazy(() => CameraPortalScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  fromCameraId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  y: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  distance: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  toCameraId: z.union([ z.lazy(() => UuidWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z.object({
  id: z.string(),
  sid: z.string(),
  data: z.string(),
  expiresAt: z.coerce.date()
}).strict();

export const SessionUncheckedCreateInputSchema: z.ZodType<Prisma.SessionUncheckedCreateInput> = z.object({
  id: z.string(),
  sid: z.string(),
  data: z.string(),
  expiresAt: z.coerce.date()
}).strict();

export const SessionUpdateInputSchema: z.ZodType<Prisma.SessionUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sid: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SessionUncheckedUpdateInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sid: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SessionCreateManyInputSchema: z.ZodType<Prisma.SessionCreateManyInput> = z.object({
  id: z.string(),
  sid: z.string(),
  data: z.string(),
  expiresAt: z.coerce.date()
}).strict();

export const SessionUpdateManyMutationInputSchema: z.ZodType<Prisma.SessionUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sid: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  sid: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  data: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueCreateNestedManyWithoutOwnersInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueCreateNestedManyWithoutWhitelistedUsersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutOwnersInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutWhitelistedUsersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUpdateManyWithoutOwnersNestedInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutOwnersNestedInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VenueCreateInputSchema: z.ZodType<Prisma.VenueCreateInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUncheckedCreateInputSchema: z.ZodType<Prisma.VenueUncheckedCreateInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUpdateInputSchema: z.ZodType<Prisma.VenueUpdateInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueCreateManyInputSchema: z.ZodType<Prisma.VenueCreateManyInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional()
}).strict();

export const VenueUpdateManyMutationInputSchema: z.ZodType<Prisma.VenueUpdateManyMutationInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VenueUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VirtualSpaceCreateInputSchema: z.ZodType<Prisma.VirtualSpaceCreateInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  venue: z.lazy(() => VenueCreateNestedOneWithoutVirtualSpaceInputSchema),
  virtualSpace3DModel: z.lazy(() => VirtualSpace3DModelCreateNestedOneWithoutVirtualSpacesInputSchema).optional()
}).strict();

export const VirtualSpaceUncheckedCreateInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedCreateInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.string(),
  virtualSpace3DModelId: z.string().optional().nullable()
}).strict();

export const VirtualSpaceUpdateInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  venue: z.lazy(() => VenueUpdateOneRequiredWithoutVirtualSpaceNestedInputSchema).optional(),
  virtualSpace3DModel: z.lazy(() => VirtualSpace3DModelUpdateOneWithoutVirtualSpacesNestedInputSchema).optional()
}).strict();

export const VirtualSpaceUncheckedUpdateInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  virtualSpace3DModelId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const VirtualSpaceCreateManyInputSchema: z.ZodType<Prisma.VirtualSpaceCreateManyInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.string(),
  virtualSpace3DModelId: z.string().optional().nullable()
}).strict();

export const VirtualSpaceUpdateManyMutationInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateManyMutationInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const VirtualSpaceUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateManyInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  virtualSpace3DModelId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const VirtualSpace3DModelCreateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateInput> = z.object({
  modelId: z.string().optional(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean().optional(),
  scale: z.number(),
  virtualSpaces: z.lazy(() => VirtualSpaceCreateNestedManyWithoutVirtualSpace3DModelInputSchema).optional()
}).strict();

export const VirtualSpace3DModelUncheckedCreateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUncheckedCreateInput> = z.object({
  modelId: z.string().optional(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean().optional(),
  scale: z.number(),
  virtualSpaces: z.lazy(() => VirtualSpaceUncheckedCreateNestedManyWithoutVirtualSpace3DModelInputSchema).optional()
}).strict();

export const VirtualSpace3DModelUpdateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  virtualSpaces: z.lazy(() => VirtualSpaceUpdateManyWithoutVirtualSpace3DModelNestedInputSchema).optional()
}).strict();

export const VirtualSpace3DModelUncheckedUpdateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUncheckedUpdateInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  virtualSpaces: z.lazy(() => VirtualSpaceUncheckedUpdateManyWithoutVirtualSpace3DModelNestedInputSchema).optional()
}).strict();

export const VirtualSpace3DModelCreateManyInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateManyInput> = z.object({
  modelId: z.string().optional(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean().optional(),
  scale: z.number()
}).strict();

export const VirtualSpace3DModelUpdateManyMutationInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateManyMutationInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VirtualSpace3DModelUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUncheckedUpdateManyInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraCreateInputSchema: z.ZodType<Prisma.CameraCreateInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venue: z.lazy(() => VenueCreateNestedOneWithoutCamerasInputSchema),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutFromCameraInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraUncheckedCreateInputSchema: z.ZodType<Prisma.CameraUncheckedCreateInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venueId: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutFromCameraInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraUpdateInputSchema: z.ZodType<Prisma.CameraUpdateInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venue: z.lazy(() => VenueUpdateOneRequiredWithoutCamerasNestedInputSchema).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutFromCameraNestedInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraUncheckedUpdateInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutFromCameraNestedInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraCreateManyInputSchema: z.ZodType<Prisma.CameraCreateManyInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venueId: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const CameraUpdateManyMutationInputSchema: z.ZodType<Prisma.CameraUpdateManyMutationInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const CameraUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateManyInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const CameraPortalCreateInputSchema: z.ZodType<Prisma.CameraPortalCreateInput> = z.object({
  fromCamera: z.lazy(() => CameraCreateNestedOneWithoutCameraPortalsInputSchema),
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCamera: z.lazy(() => CameraCreateNestedOneWithoutFromCameraPortalsInputSchema)
}).strict();

export const CameraPortalUncheckedCreateInputSchema: z.ZodType<Prisma.CameraPortalUncheckedCreateInput> = z.object({
  fromCameraId: z.string(),
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string()
}).strict();

export const CameraPortalUpdateInputSchema: z.ZodType<Prisma.CameraPortalUpdateInput> = z.object({
  fromCamera: z.lazy(() => CameraUpdateOneRequiredWithoutCameraPortalsNestedInputSchema).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCamera: z.lazy(() => CameraUpdateOneRequiredWithoutFromCameraPortalsNestedInputSchema).optional()
}).strict();

export const CameraPortalUncheckedUpdateInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateInput> = z.object({
  fromCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalCreateManyInputSchema: z.ZodType<Prisma.CameraPortalCreateManyInput> = z.object({
  fromCameraId: z.string(),
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string()
}).strict();

export const CameraPortalUpdateManyMutationInputSchema: z.ZodType<Prisma.CameraPortalUpdateManyMutationInput> = z.object({
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateManyInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateManyInput> = z.object({
  fromCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const SessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SessionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  sid: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  sid: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  sid: z.lazy(() => SortOrderSchema).optional(),
  data: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const UuidFilterSchema: z.ZodType<Prisma.UuidFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidFilterSchema) ]).optional(),
}).strict();

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
}).strict();

export const VenueListRelationFilterSchema: z.ZodType<Prisma.VenueListRelationFilter> = z.object({
  every: z.lazy(() => VenueWhereInputSchema).optional(),
  some: z.lazy(() => VenueWhereInputSchema).optional(),
  none: z.lazy(() => VenueWhereInputSchema).optional()
}).strict();

export const VenueOrderByRelationAggregateInputSchema: z.ZodType<Prisma.VenueOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  userId: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  userId: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  userId: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  password: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UuidWithAggregatesFilterSchema: z.ZodType<Prisma.UuidWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional()
}).strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.object({
  equals: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
  path: z.string().array().optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_contains: InputJsonValue.optional().nullable(),
  array_starts_with: InputJsonValue.optional().nullable(),
  array_ends_with: InputJsonValue.optional().nullable(),
  lt: InputJsonValue.optional(),
  lte: InputJsonValue.optional(),
  gt: InputJsonValue.optional(),
  gte: InputJsonValue.optional(),
  not: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
}).strict();

export const VirtualSpaceRelationFilterSchema: z.ZodType<Prisma.VirtualSpaceRelationFilter> = z.object({
  is: z.lazy(() => VirtualSpaceWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => VirtualSpaceWhereInputSchema).optional().nullable()
}).strict();

export const EnumVisibilityFilterSchema: z.ZodType<Prisma.EnumVisibilityFilter> = z.object({
  equals: z.lazy(() => VisibilitySchema).optional(),
  in: z.lazy(() => VisibilitySchema).array().optional(),
  notIn: z.lazy(() => VisibilitySchema).array().optional(),
  not: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => NestedEnumVisibilityFilterSchema) ]).optional(),
}).strict();

export const UserListRelationFilterSchema: z.ZodType<Prisma.UserListRelationFilter> = z.object({
  every: z.lazy(() => UserWhereInputSchema).optional(),
  some: z.lazy(() => UserWhereInputSchema).optional(),
  none: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const CameraListRelationFilterSchema: z.ZodType<Prisma.CameraListRelationFilter> = z.object({
  every: z.lazy(() => CameraWhereInputSchema).optional(),
  some: z.lazy(() => CameraWhereInputSchema).optional(),
  none: z.lazy(() => CameraWhereInputSchema).optional()
}).strict();

export const UserOrderByRelationAggregateInputSchema: z.ZodType<Prisma.UserOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CameraOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VenueCountOrderByAggregateInputSchema: z.ZodType<Prisma.VenueCountOrderByAggregateInput> = z.object({
  venueId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  doorsOpeningTime: z.lazy(() => SortOrderSchema).optional(),
  doorsAutoOpen: z.lazy(() => SortOrderSchema).optional(),
  doorsManuallyOpened: z.lazy(() => SortOrderSchema).optional(),
  streamStartTime: z.lazy(() => SortOrderSchema).optional(),
  streamAutoStart: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyStarted: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyEnded: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  visibility: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VenueMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VenueMaxOrderByAggregateInput> = z.object({
  venueId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  doorsOpeningTime: z.lazy(() => SortOrderSchema).optional(),
  doorsAutoOpen: z.lazy(() => SortOrderSchema).optional(),
  doorsManuallyOpened: z.lazy(() => SortOrderSchema).optional(),
  streamStartTime: z.lazy(() => SortOrderSchema).optional(),
  streamAutoStart: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyStarted: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyEnded: z.lazy(() => SortOrderSchema).optional(),
  visibility: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VenueMinOrderByAggregateInputSchema: z.ZodType<Prisma.VenueMinOrderByAggregateInput> = z.object({
  venueId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  doorsOpeningTime: z.lazy(() => SortOrderSchema).optional(),
  doorsAutoOpen: z.lazy(() => SortOrderSchema).optional(),
  doorsManuallyOpened: z.lazy(() => SortOrderSchema).optional(),
  streamStartTime: z.lazy(() => SortOrderSchema).optional(),
  streamAutoStart: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyStarted: z.lazy(() => SortOrderSchema).optional(),
  streamManuallyEnded: z.lazy(() => SortOrderSchema).optional(),
  visibility: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.object({
  equals: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
  path: z.string().array().optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_contains: InputJsonValue.optional().nullable(),
  array_starts_with: InputJsonValue.optional().nullable(),
  array_ends_with: InputJsonValue.optional().nullable(),
  lt: InputJsonValue.optional(),
  lte: InputJsonValue.optional(),
  gt: InputJsonValue.optional(),
  gte: InputJsonValue.optional(),
  not: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional()
}).strict();

export const EnumVisibilityWithAggregatesFilterSchema: z.ZodType<Prisma.EnumVisibilityWithAggregatesFilter> = z.object({
  equals: z.lazy(() => VisibilitySchema).optional(),
  in: z.lazy(() => VisibilitySchema).array().optional(),
  notIn: z.lazy(() => VisibilitySchema).array().optional(),
  not: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => NestedEnumVisibilityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumVisibilityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumVisibilityFilterSchema).optional()
}).strict();

export const VenueRelationFilterSchema: z.ZodType<Prisma.VenueRelationFilter> = z.object({
  is: z.lazy(() => VenueWhereInputSchema).optional(),
  isNot: z.lazy(() => VenueWhereInputSchema).optional()
}).strict();

export const VirtualSpace3DModelRelationFilterSchema: z.ZodType<Prisma.VirtualSpace3DModelRelationFilter> = z.object({
  is: z.lazy(() => VirtualSpace3DModelWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => VirtualSpace3DModelWhereInputSchema).optional().nullable()
}).strict();

export const UuidNullableFilterSchema: z.ZodType<Prisma.UuidNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const VirtualSpaceCountOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpaceCountOrderByAggregateInput> = z.object({
  vrId: z.lazy(() => SortOrderSchema).optional(),
  extraSettings: z.lazy(() => SortOrderSchema).optional(),
  ownerVenueId: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace3DModelId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpaceMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpaceMaxOrderByAggregateInput> = z.object({
  vrId: z.lazy(() => SortOrderSchema).optional(),
  ownerVenueId: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace3DModelId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpaceMinOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpaceMinOrderByAggregateInput> = z.object({
  vrId: z.lazy(() => SortOrderSchema).optional(),
  ownerVenueId: z.lazy(() => SortOrderSchema).optional(),
  virtualSpace3DModelId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UuidNullableWithAggregatesFilterSchema: z.ZodType<Prisma.UuidNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const FloatFilterSchema: z.ZodType<Prisma.FloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const VirtualSpaceListRelationFilterSchema: z.ZodType<Prisma.VirtualSpaceListRelationFilter> = z.object({
  every: z.lazy(() => VirtualSpaceWhereInputSchema).optional(),
  some: z.lazy(() => VirtualSpaceWhereInputSchema).optional(),
  none: z.lazy(() => VirtualSpaceWhereInputSchema).optional()
}).strict();

export const VirtualSpaceOrderByRelationAggregateInputSchema: z.ZodType<Prisma.VirtualSpaceOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpace3DModelCountOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCountOrderByAggregateInput> = z.object({
  modelId: z.lazy(() => SortOrderSchema).optional(),
  modelUrl: z.lazy(() => SortOrderSchema).optional(),
  navmeshUrl: z.lazy(() => SortOrderSchema).optional(),
  public: z.lazy(() => SortOrderSchema).optional(),
  scale: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpace3DModelAvgOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelAvgOrderByAggregateInput> = z.object({
  scale: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpace3DModelMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelMaxOrderByAggregateInput> = z.object({
  modelId: z.lazy(() => SortOrderSchema).optional(),
  modelUrl: z.lazy(() => SortOrderSchema).optional(),
  navmeshUrl: z.lazy(() => SortOrderSchema).optional(),
  public: z.lazy(() => SortOrderSchema).optional(),
  scale: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpace3DModelMinOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelMinOrderByAggregateInput> = z.object({
  modelId: z.lazy(() => SortOrderSchema).optional(),
  modelUrl: z.lazy(() => SortOrderSchema).optional(),
  navmeshUrl: z.lazy(() => SortOrderSchema).optional(),
  public: z.lazy(() => SortOrderSchema).optional(),
  scale: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const VirtualSpace3DModelSumOrderByAggregateInputSchema: z.ZodType<Prisma.VirtualSpace3DModelSumOrderByAggregateInput> = z.object({
  scale: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const FloatWithAggregatesFilterSchema: z.ZodType<Prisma.FloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const EnumCameraTypeFilterSchema: z.ZodType<Prisma.EnumCameraTypeFilter> = z.object({
  equals: z.lazy(() => CameraTypeSchema).optional(),
  in: z.lazy(() => CameraTypeSchema).array().optional(),
  notIn: z.lazy(() => CameraTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => NestedEnumCameraTypeFilterSchema) ]).optional(),
}).strict();

export const CameraPortalListRelationFilterSchema: z.ZodType<Prisma.CameraPortalListRelationFilter> = z.object({
  every: z.lazy(() => CameraPortalWhereInputSchema).optional(),
  some: z.lazy(() => CameraPortalWhereInputSchema).optional(),
  none: z.lazy(() => CameraPortalWhereInputSchema).optional()
}).strict();

export const CameraPortalOrderByRelationAggregateInputSchema: z.ZodType<Prisma.CameraPortalOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraNameVenueIdCompoundUniqueInputSchema: z.ZodType<Prisma.CameraNameVenueIdCompoundUniqueInput> = z.object({
  name: z.string(),
  venueId: z.string()
}).strict();

export const CameraSenderIdVenueIdCompoundUniqueInputSchema: z.ZodType<Prisma.CameraSenderIdVenueIdCompoundUniqueInput> = z.object({
  senderId: z.string(),
  venueId: z.string()
}).strict();

export const CameraCountOrderByAggregateInputSchema: z.ZodType<Prisma.CameraCountOrderByAggregateInput> = z.object({
  cameraId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  venueId: z.lazy(() => SortOrderSchema).optional(),
  senderId: z.lazy(() => SortOrderSchema).optional(),
  cameraType: z.lazy(() => SortOrderSchema).optional(),
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional(),
  settings: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CameraAvgOrderByAggregateInput> = z.object({
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CameraMaxOrderByAggregateInput> = z.object({
  cameraId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  venueId: z.lazy(() => SortOrderSchema).optional(),
  senderId: z.lazy(() => SortOrderSchema).optional(),
  cameraType: z.lazy(() => SortOrderSchema).optional(),
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraMinOrderByAggregateInputSchema: z.ZodType<Prisma.CameraMinOrderByAggregateInput> = z.object({
  cameraId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  venueId: z.lazy(() => SortOrderSchema).optional(),
  senderId: z.lazy(() => SortOrderSchema).optional(),
  cameraType: z.lazy(() => SortOrderSchema).optional(),
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraSumOrderByAggregateInputSchema: z.ZodType<Prisma.CameraSumOrderByAggregateInput> = z.object({
  viewOriginX: z.lazy(() => SortOrderSchema).optional(),
  viewOriginY: z.lazy(() => SortOrderSchema).optional(),
  fovStart: z.lazy(() => SortOrderSchema).optional(),
  fovEnd: z.lazy(() => SortOrderSchema).optional(),
  orientation: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumCameraTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCameraTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CameraTypeSchema).optional(),
  in: z.lazy(() => CameraTypeSchema).array().optional(),
  notIn: z.lazy(() => CameraTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => NestedEnumCameraTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCameraTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCameraTypeFilterSchema).optional()
}).strict();

export const CameraRelationFilterSchema: z.ZodType<Prisma.CameraRelationFilter> = z.object({
  is: z.lazy(() => CameraWhereInputSchema).optional(),
  isNot: z.lazy(() => CameraWhereInputSchema).optional()
}).strict();

export const CameraPortalFromCameraIdToCameraIdCompoundUniqueInputSchema: z.ZodType<Prisma.CameraPortalFromCameraIdToCameraIdCompoundUniqueInput> = z.object({
  fromCameraId: z.string(),
  toCameraId: z.string()
}).strict();

export const CameraPortalCountOrderByAggregateInputSchema: z.ZodType<Prisma.CameraPortalCountOrderByAggregateInput> = z.object({
  fromCameraId: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional(),
  toCameraId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraPortalAvgOrderByAggregateInputSchema: z.ZodType<Prisma.CameraPortalAvgOrderByAggregateInput> = z.object({
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraPortalMaxOrderByAggregateInputSchema: z.ZodType<Prisma.CameraPortalMaxOrderByAggregateInput> = z.object({
  fromCameraId: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional(),
  toCameraId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraPortalMinOrderByAggregateInputSchema: z.ZodType<Prisma.CameraPortalMinOrderByAggregateInput> = z.object({
  fromCameraId: z.lazy(() => SortOrderSchema).optional(),
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional(),
  toCameraId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const CameraPortalSumOrderByAggregateInputSchema: z.ZodType<Prisma.CameraPortalSumOrderByAggregateInput> = z.object({
  x: z.lazy(() => SortOrderSchema).optional(),
  y: z.lazy(() => SortOrderSchema).optional(),
  distance: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const VenueCreateNestedManyWithoutOwnersInputSchema: z.ZodType<Prisma.VenueCreateNestedManyWithoutOwnersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueCreateWithoutOwnersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueCreateNestedManyWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueCreateNestedManyWithoutWhitelistedUsersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueCreateNestedManyWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueCreateNestedManyWithoutBlackListedUsersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedCreateNestedManyWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateNestedManyWithoutOwnersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueCreateWithoutOwnersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedCreateNestedManyWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateNestedManyWithoutWhitelistedUsersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedCreateNestedManyWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateNestedManyWithoutBlackListedUsersInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => RoleSchema).optional()
}).strict();

export const VenueUpdateManyWithoutOwnersNestedInputSchema: z.ZodType<Prisma.VenueUpdateManyWithoutOwnersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueCreateWithoutOwnersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutOwnersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutOwnersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutOwnersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutOwnersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutOwnersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutOwnersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueUpdateManyWithoutWhitelistedUsersNestedInputSchema: z.ZodType<Prisma.VenueUpdateManyWithoutWhitelistedUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueUpdateManyWithoutBlackListedUsersNestedInputSchema: z.ZodType<Prisma.VenueUpdateManyWithoutBlackListedUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutBlackListedUsersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutBlackListedUsersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutBlackListedUsersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedUpdateManyWithoutOwnersNestedInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutOwnersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueCreateWithoutOwnersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutOwnersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutOwnersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutOwnersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutOwnersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutOwnersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutOwnersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutOwnersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedUpdateManyWithoutWhitelistedUsersNestedInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutWhitelistedUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutWhitelistedUsersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueUncheckedUpdateManyWithoutBlackListedUsersNestedInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutBlackListedUsersNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema).array(),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema),z.lazy(() => VenueCreateOrConnectWithoutBlackListedUsersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VenueUpsertWithWhereUniqueWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpsertWithWhereUniqueWithoutBlackListedUsersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VenueWhereUniqueInputSchema),z.lazy(() => VenueWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithWhereUniqueWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpdateWithWhereUniqueWithoutBlackListedUsersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VenueUpdateManyWithWhereWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUpdateManyWithWhereWithoutBlackListedUsersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VirtualSpaceCreateNestedOneWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceCreateNestedOneWithoutVenueInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpaceCreateOrConnectWithoutVenueInputSchema).optional(),
  connect: z.lazy(() => VirtualSpaceWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedManyWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserCreateNestedManyWithoutOwnedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedManyWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserCreateNestedManyWithoutAllowedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedManyWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserCreateNestedManyWithoutBannedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateWithoutBannedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CameraCreateNestedManyWithoutVenueInputSchema: z.ZodType<Prisma.CameraCreateNestedManyWithoutVenueInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraCreateWithoutVenueInputSchema).array(),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema),z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraCreateManyVenueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedCreateNestedOneWithoutVenueInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpaceCreateOrConnectWithoutVenueInputSchema).optional(),
  connect: z.lazy(() => VirtualSpaceWhereUniqueInputSchema).optional()
}).strict();

export const UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateNestedManyWithoutOwnedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateNestedManyWithoutAllowedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateNestedManyWithoutBannedVenuesInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateWithoutBannedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CameraUncheckedCreateNestedManyWithoutVenueInputSchema: z.ZodType<Prisma.CameraUncheckedCreateNestedManyWithoutVenueInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraCreateWithoutVenueInputSchema).array(),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema),z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraCreateManyVenueInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional().nullable()
}).strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional()
}).strict();

export const VirtualSpaceUpdateOneWithoutVenueNestedInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateOneWithoutVenueNestedInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpaceCreateOrConnectWithoutVenueInputSchema).optional(),
  upsert: z.lazy(() => VirtualSpaceUpsertWithoutVenueInputSchema).optional(),
  disconnect: z.boolean().optional(),
  delete: z.boolean().optional(),
  connect: z.lazy(() => VirtualSpaceWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateWithoutVenueInputSchema) ]).optional(),
}).strict();

export const EnumVisibilityFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumVisibilityFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => VisibilitySchema).optional()
}).strict();

export const UserUpdateManyWithoutOwnedVenuesNestedInputSchema: z.ZodType<Prisma.UserUpdateManyWithoutOwnedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutOwnedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutOwnedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutOwnedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserUpdateManyWithoutAllowedVenuesNestedInputSchema: z.ZodType<Prisma.UserUpdateManyWithoutAllowedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutAllowedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutAllowedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutAllowedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserUpdateManyWithoutBannedVenuesNestedInputSchema: z.ZodType<Prisma.UserUpdateManyWithoutBannedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateWithoutBannedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutBannedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutBannedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutBannedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutBannedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutBannedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutBannedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraUpdateManyWithoutVenueNestedInputSchema: z.ZodType<Prisma.CameraUpdateManyWithoutVenueNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraCreateWithoutVenueInputSchema).array(),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema),z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraUpsertWithWhereUniqueWithoutVenueInputSchema),z.lazy(() => CameraUpsertWithWhereUniqueWithoutVenueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraCreateManyVenueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraUpdateWithWhereUniqueWithoutVenueInputSchema),z.lazy(() => CameraUpdateWithWhereUniqueWithoutVenueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraUpdateManyWithWhereWithoutVenueInputSchema),z.lazy(() => CameraUpdateManyWithWhereWithoutVenueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraScalarWhereInputSchema),z.lazy(() => CameraScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpaceCreateOrConnectWithoutVenueInputSchema).optional(),
  upsert: z.lazy(() => VirtualSpaceUpsertWithoutVenueInputSchema).optional(),
  disconnect: z.boolean().optional(),
  delete: z.boolean().optional(),
  connect: z.lazy(() => VirtualSpaceWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateWithoutVenueInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutOwnedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutOwnedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutOwnedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutOwnedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutOwnedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutOwnedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutAllowedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutAllowedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutAllowedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutAllowedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutAllowedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutAllowedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutBannedVenuesNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateWithoutBannedVenuesInputSchema).array(),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema),z.lazy(() => UserCreateOrConnectWithoutBannedVenuesInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => UserUpsertWithWhereUniqueWithoutBannedVenuesInputSchema),z.lazy(() => UserUpsertWithWhereUniqueWithoutBannedVenuesInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => UserWhereUniqueInputSchema),z.lazy(() => UserWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => UserUpdateWithWhereUniqueWithoutBannedVenuesInputSchema),z.lazy(() => UserUpdateWithWhereUniqueWithoutBannedVenuesInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => UserUpdateManyWithWhereWithoutBannedVenuesInputSchema),z.lazy(() => UserUpdateManyWithWhereWithoutBannedVenuesInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraUncheckedUpdateManyWithoutVenueNestedInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateManyWithoutVenueNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraCreateWithoutVenueInputSchema).array(),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema),z.lazy(() => CameraCreateOrConnectWithoutVenueInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraUpsertWithWhereUniqueWithoutVenueInputSchema),z.lazy(() => CameraUpsertWithWhereUniqueWithoutVenueInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraCreateManyVenueInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraWhereUniqueInputSchema),z.lazy(() => CameraWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraUpdateWithWhereUniqueWithoutVenueInputSchema),z.lazy(() => CameraUpdateWithWhereUniqueWithoutVenueInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraUpdateManyWithWhereWithoutVenueInputSchema),z.lazy(() => CameraUpdateManyWithWhereWithoutVenueInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraScalarWhereInputSchema),z.lazy(() => CameraScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueCreateNestedOneWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueCreateNestedOneWithoutVirtualSpaceInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedCreateWithoutVirtualSpaceInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VenueCreateOrConnectWithoutVirtualSpaceInputSchema).optional(),
  connect: z.lazy(() => VenueWhereUniqueInputSchema).optional()
}).strict();

export const VirtualSpace3DModelCreateNestedOneWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateNestedOneWithoutVirtualSpacesInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpace3DModelCreateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpace3DModelCreateOrConnectWithoutVirtualSpacesInputSchema).optional(),
  connect: z.lazy(() => VirtualSpace3DModelWhereUniqueInputSchema).optional()
}).strict();

export const VenueUpdateOneRequiredWithoutVirtualSpaceNestedInputSchema: z.ZodType<Prisma.VenueUpdateOneRequiredWithoutVirtualSpaceNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedCreateWithoutVirtualSpaceInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VenueCreateOrConnectWithoutVirtualSpaceInputSchema).optional(),
  upsert: z.lazy(() => VenueUpsertWithoutVirtualSpaceInputSchema).optional(),
  connect: z.lazy(() => VenueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutVirtualSpaceInputSchema) ]).optional(),
}).strict();

export const VirtualSpace3DModelUpdateOneWithoutVirtualSpacesNestedInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateOneWithoutVirtualSpacesNestedInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpace3DModelCreateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VirtualSpace3DModelCreateOrConnectWithoutVirtualSpacesInputSchema).optional(),
  upsert: z.lazy(() => VirtualSpace3DModelUpsertWithoutVirtualSpacesInputSchema).optional(),
  disconnect: z.boolean().optional(),
  delete: z.boolean().optional(),
  connect: z.lazy(() => VirtualSpace3DModelWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => VirtualSpace3DModelUpdateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedUpdateWithoutVirtualSpacesInputSchema) ]).optional(),
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const VirtualSpaceCreateNestedManyWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceCreateNestedManyWithoutVirtualSpace3DModelInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema).array(),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  createMany: z.lazy(() => VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VirtualSpaceUncheckedCreateNestedManyWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedCreateNestedManyWithoutVirtualSpace3DModelInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema).array(),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  createMany: z.lazy(() => VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const FloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.FloatFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const VirtualSpaceUpdateManyWithoutVirtualSpace3DModelNestedInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateManyWithoutVirtualSpace3DModelNestedInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema).array(),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  createMany: z.lazy(() => VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VirtualSpaceScalarWhereInputSchema),z.lazy(() => VirtualSpaceScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VirtualSpaceUncheckedUpdateManyWithoutVirtualSpace3DModelNestedInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateManyWithoutVirtualSpace3DModelNestedInput> = z.object({
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema).array(),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  createMany: z.lazy(() => VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => VirtualSpaceWhereUniqueInputSchema),z.lazy(() => VirtualSpaceWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => VirtualSpaceScalarWhereInputSchema),z.lazy(() => VirtualSpaceScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const VenueCreateNestedOneWithoutCamerasInputSchema: z.ZodType<Prisma.VenueCreateNestedOneWithoutCamerasInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedCreateWithoutCamerasInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VenueCreateOrConnectWithoutCamerasInputSchema).optional(),
  connect: z.lazy(() => VenueWhereUniqueInputSchema).optional()
}).strict();

export const CameraPortalCreateNestedManyWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateNestedManyWithoutFromCameraInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyFromCameraInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalCreateNestedManyWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateNestedManyWithoutToCameraInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyToCameraInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalUncheckedCreateNestedManyWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedCreateNestedManyWithoutFromCameraInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyFromCameraInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalUncheckedCreateNestedManyWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedCreateNestedManyWithoutToCameraInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyToCameraInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const VenueUpdateOneRequiredWithoutCamerasNestedInputSchema: z.ZodType<Prisma.VenueUpdateOneRequiredWithoutCamerasNestedInput> = z.object({
  create: z.union([ z.lazy(() => VenueCreateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedCreateWithoutCamerasInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => VenueCreateOrConnectWithoutCamerasInputSchema).optional(),
  upsert: z.lazy(() => VenueUpsertWithoutCamerasInputSchema).optional(),
  connect: z.lazy(() => VenueWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => VenueUpdateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutCamerasInputSchema) ]).optional(),
}).strict();

export const EnumCameraTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCameraTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => CameraTypeSchema).optional()
}).strict();

export const CameraPortalUpdateManyWithoutFromCameraNestedInputSchema: z.ZodType<Prisma.CameraPortalUpdateManyWithoutFromCameraNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutFromCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyFromCameraInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutFromCameraInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraPortalUpdateManyWithWhereWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpdateManyWithWhereWithoutFromCameraInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalUpdateManyWithoutToCameraNestedInputSchema: z.ZodType<Prisma.CameraPortalUpdateManyWithoutToCameraNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutToCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyToCameraInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutToCameraInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraPortalUpdateManyWithWhereWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpdateManyWithWhereWithoutToCameraInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateManyWithoutFromCameraNestedInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateManyWithoutFromCameraNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutFromCameraInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutFromCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyFromCameraInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutFromCameraInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraPortalUpdateManyWithWhereWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUpdateManyWithWhereWithoutFromCameraInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateManyWithoutToCameraNestedInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateManyWithoutToCameraNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema).array(),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema),z.lazy(() => CameraPortalCreateOrConnectWithoutToCameraInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpsertWithWhereUniqueWithoutToCameraInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CameraPortalCreateManyToCameraInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CameraPortalWhereUniqueInputSchema),z.lazy(() => CameraPortalWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpdateWithWhereUniqueWithoutToCameraInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CameraPortalUpdateManyWithWhereWithoutToCameraInputSchema),z.lazy(() => CameraPortalUpdateManyWithWhereWithoutToCameraInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const CameraCreateNestedOneWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateNestedOneWithoutCameraPortalsInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutCameraPortalsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CameraCreateOrConnectWithoutCameraPortalsInputSchema).optional(),
  connect: z.lazy(() => CameraWhereUniqueInputSchema).optional()
}).strict();

export const CameraCreateNestedOneWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateNestedOneWithoutFromCameraPortalsInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutFromCameraPortalsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CameraCreateOrConnectWithoutFromCameraPortalsInputSchema).optional(),
  connect: z.lazy(() => CameraWhereUniqueInputSchema).optional()
}).strict();

export const CameraUpdateOneRequiredWithoutCameraPortalsNestedInputSchema: z.ZodType<Prisma.CameraUpdateOneRequiredWithoutCameraPortalsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutCameraPortalsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CameraCreateOrConnectWithoutCameraPortalsInputSchema).optional(),
  upsert: z.lazy(() => CameraUpsertWithoutCameraPortalsInputSchema).optional(),
  connect: z.lazy(() => CameraWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CameraUpdateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutCameraPortalsInputSchema) ]).optional(),
}).strict();

export const CameraUpdateOneRequiredWithoutFromCameraPortalsNestedInputSchema: z.ZodType<Prisma.CameraUpdateOneRequiredWithoutFromCameraPortalsNestedInput> = z.object({
  create: z.union([ z.lazy(() => CameraCreateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutFromCameraPortalsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => CameraCreateOrConnectWithoutFromCameraPortalsInputSchema).optional(),
  upsert: z.lazy(() => CameraUpsertWithoutFromCameraPortalsInputSchema).optional(),
  connect: z.lazy(() => CameraWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => CameraUpdateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutFromCameraPortalsInputSchema) ]).optional(),
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedUuidFilterSchema: z.ZodType<Prisma.NestedUuidFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidFilterSchema) ]).optional(),
}).strict();

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
}).strict();

export const NestedUuidWithAggregatesFilterSchema: z.ZodType<Prisma.NestedUuidWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional()
}).strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const NestedEnumVisibilityFilterSchema: z.ZodType<Prisma.NestedEnumVisibilityFilter> = z.object({
  equals: z.lazy(() => VisibilitySchema).optional(),
  in: z.lazy(() => VisibilitySchema).array().optional(),
  notIn: z.lazy(() => VisibilitySchema).array().optional(),
  not: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => NestedEnumVisibilityFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.object({
  equals: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
  path: z.string().array().optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_contains: InputJsonValue.optional().nullable(),
  array_starts_with: InputJsonValue.optional().nullable(),
  array_ends_with: InputJsonValue.optional().nullable(),
  lt: InputJsonValue.optional(),
  lte: InputJsonValue.optional(),
  gt: InputJsonValue.optional(),
  gte: InputJsonValue.optional(),
  not: z.union([ InputJsonValue,z.lazy(() => JsonNullValueFilterSchema) ]).optional(),
}).strict();

export const NestedEnumVisibilityWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumVisibilityWithAggregatesFilter> = z.object({
  equals: z.lazy(() => VisibilitySchema).optional(),
  in: z.lazy(() => VisibilitySchema).array().optional(),
  notIn: z.lazy(() => VisibilitySchema).array().optional(),
  not: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => NestedEnumVisibilityWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumVisibilityFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumVisibilityFilterSchema).optional()
}).strict();

export const NestedUuidNullableFilterSchema: z.ZodType<Prisma.NestedUuidNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedUuidNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedUuidNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedUuidNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const NestedFloatWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const NestedEnumCameraTypeFilterSchema: z.ZodType<Prisma.NestedEnumCameraTypeFilter> = z.object({
  equals: z.lazy(() => CameraTypeSchema).optional(),
  in: z.lazy(() => CameraTypeSchema).array().optional(),
  notIn: z.lazy(() => CameraTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => NestedEnumCameraTypeFilterSchema) ]).optional(),
}).strict();

export const NestedEnumCameraTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCameraTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CameraTypeSchema).optional(),
  in: z.lazy(() => CameraTypeSchema).array().optional(),
  notIn: z.lazy(() => CameraTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => NestedEnumCameraTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCameraTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCameraTypeFilterSchema).optional()
}).strict();

export const VenueCreateWithoutOwnersInputSchema: z.ZodType<Prisma.VenueCreateWithoutOwnersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  whitelistedUsers: z.lazy(() => UserCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUncheckedCreateWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateWithoutOwnersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueCreateOrConnectWithoutOwnersInputSchema: z.ZodType<Prisma.VenueCreateOrConnectWithoutOwnersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema) ]),
}).strict();

export const VenueCreateWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueCreateWithoutWhitelistedUsersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUncheckedCreateWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateWithoutWhitelistedUsersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueCreateOrConnectWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueCreateOrConnectWithoutWhitelistedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema) ]),
}).strict();

export const VenueCreateWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueCreateWithoutBlackListedUsersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUncheckedCreateWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedCreateWithoutBlackListedUsersInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueCreateOrConnectWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueCreateOrConnectWithoutBlackListedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema) ]),
}).strict();

export const VenueUpsertWithWhereUniqueWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUpsertWithWhereUniqueWithoutOwnersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => VenueUpdateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutOwnersInputSchema) ]),
  create: z.union([ z.lazy(() => VenueCreateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutOwnersInputSchema) ]),
}).strict();

export const VenueUpdateWithWhereUniqueWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUpdateWithWhereUniqueWithoutOwnersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateWithoutOwnersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutOwnersInputSchema) ]),
}).strict();

export const VenueUpdateManyWithWhereWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUpdateManyWithWhereWithoutOwnersInput> = z.object({
  where: z.lazy(() => VenueScalarWhereInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateManyMutationInputSchema),z.lazy(() => VenueUncheckedUpdateManyWithoutOwnedVenuesInputSchema) ]),
}).strict();

export const VenueScalarWhereInputSchema: z.ZodType<Prisma.VenueScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VenueScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VenueScalarWhereInputSchema),z.lazy(() => VenueScalarWhereInputSchema).array() ]).optional(),
  venueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  doorsOpeningTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  doorsManuallyOpened: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamStartTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  streamAutoStart: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamManuallyStarted: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  streamManuallyEnded: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableFilterSchema).optional(),
  visibility: z.union([ z.lazy(() => EnumVisibilityFilterSchema),z.lazy(() => VisibilitySchema) ]).optional(),
}).strict();

export const VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUpsertWithWhereUniqueWithoutWhitelistedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => VenueUpdateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutWhitelistedUsersInputSchema) ]),
  create: z.union([ z.lazy(() => VenueCreateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutWhitelistedUsersInputSchema) ]),
}).strict();

export const VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUpdateWithWhereUniqueWithoutWhitelistedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateWithoutWhitelistedUsersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutWhitelistedUsersInputSchema) ]),
}).strict();

export const VenueUpdateManyWithWhereWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUpdateManyWithWhereWithoutWhitelistedUsersInput> = z.object({
  where: z.lazy(() => VenueScalarWhereInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateManyMutationInputSchema),z.lazy(() => VenueUncheckedUpdateManyWithoutAllowedVenuesInputSchema) ]),
}).strict();

export const VenueUpsertWithWhereUniqueWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUpsertWithWhereUniqueWithoutBlackListedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => VenueUpdateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutBlackListedUsersInputSchema) ]),
  create: z.union([ z.lazy(() => VenueCreateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedCreateWithoutBlackListedUsersInputSchema) ]),
}).strict();

export const VenueUpdateWithWhereUniqueWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUpdateWithWhereUniqueWithoutBlackListedUsersInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateWithoutBlackListedUsersInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutBlackListedUsersInputSchema) ]),
}).strict();

export const VenueUpdateManyWithWhereWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUpdateManyWithWhereWithoutBlackListedUsersInput> = z.object({
  where: z.lazy(() => VenueScalarWhereInputSchema),
  data: z.union([ z.lazy(() => VenueUpdateManyMutationInputSchema),z.lazy(() => VenueUncheckedUpdateManyWithoutBannedVenuesInputSchema) ]),
}).strict();

export const VirtualSpaceCreateWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceCreateWithoutVenueInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace3DModel: z.lazy(() => VirtualSpace3DModelCreateNestedOneWithoutVirtualSpacesInputSchema).optional()
}).strict();

export const VirtualSpaceUncheckedCreateWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedCreateWithoutVenueInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace3DModelId: z.string().optional().nullable()
}).strict();

export const VirtualSpaceCreateOrConnectWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceCreateOrConnectWithoutVenueInput> = z.object({
  where: z.lazy(() => VirtualSpaceWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]),
}).strict();

export const UserCreateWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserCreateWithoutOwnedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  allowedVenues: z.lazy(() => VenueCreateNestedManyWithoutWhitelistedUsersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutOwnedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutWhitelistedUsersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutOwnedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema) ]),
}).strict();

export const UserCreateWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserCreateWithoutAllowedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueCreateNestedManyWithoutOwnersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAllowedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutOwnersInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutBlackListedUsersInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAllowedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema) ]),
}).strict();

export const UserCreateWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserCreateWithoutBannedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueCreateNestedManyWithoutOwnersInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueCreateNestedManyWithoutWhitelistedUsersInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutBannedVenuesInput> = z.object({
  userId: z.string().optional(),
  updatedAt: z.coerce.date().optional(),
  username: z.string(),
  password: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutOwnersInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedCreateNestedManyWithoutWhitelistedUsersInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutBannedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema) ]),
}).strict();

export const CameraCreateWithoutVenueInputSchema: z.ZodType<Prisma.CameraCreateWithoutVenueInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutFromCameraInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraUncheckedCreateWithoutVenueInputSchema: z.ZodType<Prisma.CameraUncheckedCreateWithoutVenueInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutFromCameraInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraCreateOrConnectWithoutVenueInputSchema: z.ZodType<Prisma.CameraCreateOrConnectWithoutVenueInput> = z.object({
  where: z.lazy(() => CameraWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema) ]),
}).strict();

export const CameraCreateManyVenueInputEnvelopeSchema: z.ZodType<Prisma.CameraCreateManyVenueInputEnvelope> = z.object({
  data: z.lazy(() => CameraCreateManyVenueInputSchema).array(),
  skipDuplicates: z.boolean().optional()
}).strict();

export const VirtualSpaceUpsertWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceUpsertWithoutVenueInput> = z.object({
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateWithoutVenueInputSchema) ]),
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVenueInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVenueInputSchema) ]),
}).strict();

export const VirtualSpaceUpdateWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateWithoutVenueInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace3DModel: z.lazy(() => VirtualSpace3DModelUpdateOneWithoutVirtualSpacesNestedInputSchema).optional()
}).strict();

export const VirtualSpaceUncheckedUpdateWithoutVenueInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateWithoutVenueInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace3DModelId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const UserUpsertWithWhereUniqueWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUpsertWithWhereUniqueWithoutOwnedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserUpdateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOwnedVenuesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedVenuesInputSchema) ]),
}).strict();

export const UserUpdateWithWhereUniqueWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithWhereUniqueWithoutOwnedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserUpdateWithoutOwnedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOwnedVenuesInputSchema) ]),
}).strict();

export const UserUpdateManyWithWhereWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUpdateManyWithWhereWithoutOwnedVenuesInput> = z.object({
  where: z.lazy(() => UserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserUpdateManyMutationInputSchema),z.lazy(() => UserUncheckedUpdateManyWithoutOwnersInputSchema) ]),
}).strict();

export const UserScalarWhereInputSchema: z.ZodType<Prisma.UserScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereInputSchema),z.lazy(() => UserScalarWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  username: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  password: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
}).strict();

export const UserUpsertWithWhereUniqueWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUpsertWithWhereUniqueWithoutAllowedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserUpdateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutAllowedVenuesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutAllowedVenuesInputSchema) ]),
}).strict();

export const UserUpdateWithWhereUniqueWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithWhereUniqueWithoutAllowedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserUpdateWithoutAllowedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutAllowedVenuesInputSchema) ]),
}).strict();

export const UserUpdateManyWithWhereWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUpdateManyWithWhereWithoutAllowedVenuesInput> = z.object({
  where: z.lazy(() => UserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserUpdateManyMutationInputSchema),z.lazy(() => UserUncheckedUpdateManyWithoutWhitelistedUsersInputSchema) ]),
}).strict();

export const UserUpsertWithWhereUniqueWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUpsertWithWhereUniqueWithoutBannedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => UserUpdateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBannedVenuesInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedCreateWithoutBannedVenuesInputSchema) ]),
}).strict();

export const UserUpdateWithWhereUniqueWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithWhereUniqueWithoutBannedVenuesInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => UserUpdateWithoutBannedVenuesInputSchema),z.lazy(() => UserUncheckedUpdateWithoutBannedVenuesInputSchema) ]),
}).strict();

export const UserUpdateManyWithWhereWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUpdateManyWithWhereWithoutBannedVenuesInput> = z.object({
  where: z.lazy(() => UserScalarWhereInputSchema),
  data: z.union([ z.lazy(() => UserUpdateManyMutationInputSchema),z.lazy(() => UserUncheckedUpdateManyWithoutBlackListedUsersInputSchema) ]),
}).strict();

export const CameraUpsertWithWhereUniqueWithoutVenueInputSchema: z.ZodType<Prisma.CameraUpsertWithWhereUniqueWithoutVenueInput> = z.object({
  where: z.lazy(() => CameraWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CameraUpdateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutVenueInputSchema) ]),
  create: z.union([ z.lazy(() => CameraCreateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedCreateWithoutVenueInputSchema) ]),
}).strict();

export const CameraUpdateWithWhereUniqueWithoutVenueInputSchema: z.ZodType<Prisma.CameraUpdateWithWhereUniqueWithoutVenueInput> = z.object({
  where: z.lazy(() => CameraWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CameraUpdateWithoutVenueInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutVenueInputSchema) ]),
}).strict();

export const CameraUpdateManyWithWhereWithoutVenueInputSchema: z.ZodType<Prisma.CameraUpdateManyWithWhereWithoutVenueInput> = z.object({
  where: z.lazy(() => CameraScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CameraUpdateManyMutationInputSchema),z.lazy(() => CameraUncheckedUpdateManyWithoutCamerasInputSchema) ]),
}).strict();

export const CameraScalarWhereInputSchema: z.ZodType<Prisma.CameraScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CameraScalarWhereInputSchema),z.lazy(() => CameraScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraScalarWhereInputSchema),z.lazy(() => CameraScalarWhereInputSchema).array() ]).optional(),
  cameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  venueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  senderId: z.union([ z.lazy(() => UuidNullableFilterSchema),z.string() ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => EnumCameraTypeFilterSchema),z.lazy(() => CameraTypeSchema) ]).optional(),
  viewOriginX: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  viewOriginY: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fovStart: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fovEnd: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  orientation: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  settings: z.lazy(() => JsonNullableFilterSchema).optional()
}).strict();

export const VenueCreateWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueCreateWithoutVirtualSpaceInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueUncheckedCreateWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueUncheckedCreateWithoutVirtualSpaceInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedCreateNestedManyWithoutVenueInputSchema).optional()
}).strict();

export const VenueCreateOrConnectWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueCreateOrConnectWithoutVirtualSpaceInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VenueCreateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedCreateWithoutVirtualSpaceInputSchema) ]),
}).strict();

export const VirtualSpace3DModelCreateWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateWithoutVirtualSpacesInput> = z.object({
  modelId: z.string().optional(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean().optional(),
  scale: z.number()
}).strict();

export const VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInput> = z.object({
  modelId: z.string().optional(),
  modelUrl: z.string(),
  navmeshUrl: z.string(),
  public: z.boolean().optional(),
  scale: z.number()
}).strict();

export const VirtualSpace3DModelCreateOrConnectWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateOrConnectWithoutVirtualSpacesInput> = z.object({
  where: z.lazy(() => VirtualSpace3DModelWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VirtualSpace3DModelCreateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInputSchema) ]),
}).strict();

export const VenueUpsertWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueUpsertWithoutVirtualSpaceInput> = z.object({
  update: z.union([ z.lazy(() => VenueUpdateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutVirtualSpaceInputSchema) ]),
  create: z.union([ z.lazy(() => VenueCreateWithoutVirtualSpaceInputSchema),z.lazy(() => VenueUncheckedCreateWithoutVirtualSpaceInputSchema) ]),
}).strict();

export const VenueUpdateWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueUpdateWithoutVirtualSpaceInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateWithoutVirtualSpaceInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateWithoutVirtualSpaceInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VirtualSpace3DModelUpsertWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUpsertWithoutVirtualSpacesInput> = z.object({
  update: z.union([ z.lazy(() => VirtualSpace3DModelUpdateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedUpdateWithoutVirtualSpacesInputSchema) ]),
  create: z.union([ z.lazy(() => VirtualSpace3DModelCreateWithoutVirtualSpacesInputSchema),z.lazy(() => VirtualSpace3DModelUncheckedCreateWithoutVirtualSpacesInputSchema) ]),
}).strict();

export const VirtualSpace3DModelUpdateWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateWithoutVirtualSpacesInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VirtualSpace3DModelUncheckedUpdateWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpace3DModelUncheckedUpdateWithoutVirtualSpacesInput> = z.object({
  modelId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  modelUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  navmeshUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  public: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  scale: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceCreateWithoutVirtualSpace3DModelInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  venue: z.lazy(() => VenueCreateNestedOneWithoutVirtualSpaceInputSchema)
}).strict();

export const VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.string()
}).strict();

export const VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceCreateOrConnectWithoutVirtualSpace3DModelInput> = z.object({
  where: z.lazy(() => VirtualSpaceWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema) ]),
}).strict();

export const VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelopeSchema: z.ZodType<Prisma.VirtualSpaceCreateManyVirtualSpace3DModelInputEnvelope> = z.object({
  data: z.lazy(() => VirtualSpaceCreateManyVirtualSpace3DModelInputSchema).array(),
  skipDuplicates: z.boolean().optional()
}).strict();

export const VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUpsertWithWhereUniqueWithoutVirtualSpace3DModelInput> = z.object({
  where: z.lazy(() => VirtualSpaceWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => VirtualSpaceUpdateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateWithoutVirtualSpace3DModelInputSchema) ]),
  create: z.union([ z.lazy(() => VirtualSpaceCreateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedCreateWithoutVirtualSpace3DModelInputSchema) ]),
}).strict();

export const VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateWithWhereUniqueWithoutVirtualSpace3DModelInput> = z.object({
  where: z.lazy(() => VirtualSpaceWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => VirtualSpaceUpdateWithoutVirtualSpace3DModelInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateWithoutVirtualSpace3DModelInputSchema) ]),
}).strict();

export const VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateManyWithWhereWithoutVirtualSpace3DModelInput> = z.object({
  where: z.lazy(() => VirtualSpaceScalarWhereInputSchema),
  data: z.union([ z.lazy(() => VirtualSpaceUpdateManyMutationInputSchema),z.lazy(() => VirtualSpaceUncheckedUpdateManyWithoutVirtualSpacesInputSchema) ]),
}).strict();

export const VirtualSpaceScalarWhereInputSchema: z.ZodType<Prisma.VirtualSpaceScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => VirtualSpaceScalarWhereInputSchema),z.lazy(() => VirtualSpaceScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => VirtualSpaceScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => VirtualSpaceScalarWhereInputSchema),z.lazy(() => VirtualSpaceScalarWhereInputSchema).array() ]).optional(),
  vrId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  extraSettings: z.lazy(() => JsonNullableFilterSchema).optional(),
  ownerVenueId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  virtualSpace3DModelId: z.union([ z.lazy(() => UuidNullableFilterSchema),z.string() ]).optional().nullable(),
}).strict();

export const VenueCreateWithoutCamerasInputSchema: z.ZodType<Prisma.VenueCreateWithoutCamerasInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserCreateNestedManyWithoutBannedVenuesInputSchema).optional()
}).strict();

export const VenueUncheckedCreateWithoutCamerasInputSchema: z.ZodType<Prisma.VenueUncheckedCreateWithoutCamerasInput> = z.object({
  venueId: z.string().optional(),
  name: z.string(),
  doorsOpeningTime: z.coerce.date().optional().nullable(),
  doorsAutoOpen: z.boolean().optional(),
  doorsManuallyOpened: z.boolean().optional(),
  streamStartTime: z.coerce.date().optional().nullable(),
  streamAutoStart: z.boolean().optional(),
  streamManuallyStarted: z.boolean().optional(),
  streamManuallyEnded: z.boolean().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedCreateNestedOneWithoutVenueInputSchema).optional(),
  visibility: z.lazy(() => VisibilitySchema).optional(),
  owners: z.lazy(() => UserUncheckedCreateNestedManyWithoutOwnedVenuesInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutAllowedVenuesInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedCreateNestedManyWithoutBannedVenuesInputSchema).optional()
}).strict();

export const VenueCreateOrConnectWithoutCamerasInputSchema: z.ZodType<Prisma.VenueCreateOrConnectWithoutCamerasInput> = z.object({
  where: z.lazy(() => VenueWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => VenueCreateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedCreateWithoutCamerasInputSchema) ]),
}).strict();

export const CameraPortalCreateWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateWithoutFromCameraInput> = z.object({
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCamera: z.lazy(() => CameraCreateNestedOneWithoutFromCameraPortalsInputSchema)
}).strict();

export const CameraPortalUncheckedCreateWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedCreateWithoutFromCameraInput> = z.object({
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string()
}).strict();

export const CameraPortalCreateOrConnectWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateOrConnectWithoutFromCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema) ]),
}).strict();

export const CameraPortalCreateManyFromCameraInputEnvelopeSchema: z.ZodType<Prisma.CameraPortalCreateManyFromCameraInputEnvelope> = z.object({
  data: z.lazy(() => CameraPortalCreateManyFromCameraInputSchema).array(),
  skipDuplicates: z.boolean().optional()
}).strict();

export const CameraPortalCreateWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateWithoutToCameraInput> = z.object({
  fromCamera: z.lazy(() => CameraCreateNestedOneWithoutCameraPortalsInputSchema),
  x: z.number(),
  y: z.number(),
  distance: z.number()
}).strict();

export const CameraPortalUncheckedCreateWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedCreateWithoutToCameraInput> = z.object({
  fromCameraId: z.string(),
  x: z.number(),
  y: z.number(),
  distance: z.number()
}).strict();

export const CameraPortalCreateOrConnectWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateOrConnectWithoutToCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema) ]),
}).strict();

export const CameraPortalCreateManyToCameraInputEnvelopeSchema: z.ZodType<Prisma.CameraPortalCreateManyToCameraInputEnvelope> = z.object({
  data: z.lazy(() => CameraPortalCreateManyToCameraInputSchema).array(),
  skipDuplicates: z.boolean().optional()
}).strict();

export const VenueUpsertWithoutCamerasInputSchema: z.ZodType<Prisma.VenueUpsertWithoutCamerasInput> = z.object({
  update: z.union([ z.lazy(() => VenueUpdateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedUpdateWithoutCamerasInputSchema) ]),
  create: z.union([ z.lazy(() => VenueCreateWithoutCamerasInputSchema),z.lazy(() => VenueUncheckedCreateWithoutCamerasInputSchema) ]),
}).strict();

export const VenueUpdateWithoutCamerasInputSchema: z.ZodType<Prisma.VenueUpdateWithoutCamerasInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUpdateManyWithoutBannedVenuesNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateWithoutCamerasInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateWithoutCamerasInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema).optional()
}).strict();

export const CameraPortalUpsertWithWhereUniqueWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUpsertWithWhereUniqueWithoutFromCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedUpdateWithoutFromCameraInputSchema) ]),
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutFromCameraInputSchema) ]),
}).strict();

export const CameraPortalUpdateWithWhereUniqueWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateWithWhereUniqueWithoutFromCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CameraPortalUpdateWithoutFromCameraInputSchema),z.lazy(() => CameraPortalUncheckedUpdateWithoutFromCameraInputSchema) ]),
}).strict();

export const CameraPortalUpdateManyWithWhereWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateManyWithWhereWithoutFromCameraInput> = z.object({
  where: z.lazy(() => CameraPortalScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CameraPortalUpdateManyMutationInputSchema),z.lazy(() => CameraPortalUncheckedUpdateManyWithoutCameraPortalsInputSchema) ]),
}).strict();

export const CameraPortalScalarWhereInputSchema: z.ZodType<Prisma.CameraPortalScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CameraPortalScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CameraPortalScalarWhereInputSchema),z.lazy(() => CameraPortalScalarWhereInputSchema).array() ]).optional(),
  fromCameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
  x: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  y: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  distance: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  toCameraId: z.union([ z.lazy(() => UuidFilterSchema),z.string() ]).optional(),
}).strict();

export const CameraPortalUpsertWithWhereUniqueWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUpsertWithWhereUniqueWithoutToCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => CameraPortalUpdateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedUpdateWithoutToCameraInputSchema) ]),
  create: z.union([ z.lazy(() => CameraPortalCreateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedCreateWithoutToCameraInputSchema) ]),
}).strict();

export const CameraPortalUpdateWithWhereUniqueWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateWithWhereUniqueWithoutToCameraInput> = z.object({
  where: z.lazy(() => CameraPortalWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => CameraPortalUpdateWithoutToCameraInputSchema),z.lazy(() => CameraPortalUncheckedUpdateWithoutToCameraInputSchema) ]),
}).strict();

export const CameraPortalUpdateManyWithWhereWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateManyWithWhereWithoutToCameraInput> = z.object({
  where: z.lazy(() => CameraPortalScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CameraPortalUpdateManyMutationInputSchema),z.lazy(() => CameraPortalUncheckedUpdateManyWithoutFromCameraPortalsInputSchema) ]),
}).strict();

export const CameraCreateWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateWithoutCameraPortalsInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venue: z.lazy(() => VenueCreateNestedOneWithoutCamerasInputSchema),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraUncheckedCreateWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraUncheckedCreateWithoutCameraPortalsInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venueId: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutToCameraInputSchema).optional()
}).strict();

export const CameraCreateOrConnectWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateOrConnectWithoutCameraPortalsInput> = z.object({
  where: z.lazy(() => CameraWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CameraCreateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutCameraPortalsInputSchema) ]),
}).strict();

export const CameraCreateWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateWithoutFromCameraPortalsInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venue: z.lazy(() => VenueCreateNestedOneWithoutCamerasInputSchema),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalCreateNestedManyWithoutFromCameraInputSchema).optional()
}).strict();

export const CameraUncheckedCreateWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraUncheckedCreateWithoutFromCameraPortalsInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  venueId: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedCreateNestedManyWithoutFromCameraInputSchema).optional()
}).strict();

export const CameraCreateOrConnectWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraCreateOrConnectWithoutFromCameraPortalsInput> = z.object({
  where: z.lazy(() => CameraWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CameraCreateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutFromCameraPortalsInputSchema) ]),
}).strict();

export const CameraUpsertWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraUpsertWithoutCameraPortalsInput> = z.object({
  update: z.union([ z.lazy(() => CameraUpdateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutCameraPortalsInputSchema) ]),
  create: z.union([ z.lazy(() => CameraCreateWithoutCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutCameraPortalsInputSchema) ]),
}).strict();

export const CameraUpdateWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraUpdateWithoutCameraPortalsInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venue: z.lazy(() => VenueUpdateOneRequiredWithoutCamerasNestedInputSchema).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraUncheckedUpdateWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateWithoutCameraPortalsInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraUpsertWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraUpsertWithoutFromCameraPortalsInput> = z.object({
  update: z.union([ z.lazy(() => CameraUpdateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedUpdateWithoutFromCameraPortalsInputSchema) ]),
  create: z.union([ z.lazy(() => CameraCreateWithoutFromCameraPortalsInputSchema),z.lazy(() => CameraUncheckedCreateWithoutFromCameraPortalsInputSchema) ]),
}).strict();

export const CameraUpdateWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraUpdateWithoutFromCameraPortalsInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venue: z.lazy(() => VenueUpdateOneRequiredWithoutCamerasNestedInputSchema).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutFromCameraNestedInputSchema).optional()
}).strict();

export const CameraUncheckedUpdateWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateWithoutFromCameraPortalsInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutFromCameraNestedInputSchema).optional()
}).strict();

export const VenueUpdateWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUpdateWithoutOwnersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  whitelistedUsers: z.lazy(() => UserUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateWithoutOwnersInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateWithoutOwnersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateManyWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutOwnedVenuesInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VenueUpdateWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUpdateWithoutWhitelistedUsersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateWithoutWhitelistedUsersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  blackListedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutBannedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateManyWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutAllowedVenuesInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VenueUpdateWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUpdateWithoutBlackListedUsersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateWithoutBlackListedUsersInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  virtualSpace: z.lazy(() => VirtualSpaceUncheckedUpdateOneWithoutVenueNestedInputSchema).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
  owners: z.lazy(() => UserUncheckedUpdateManyWithoutOwnedVenuesNestedInputSchema).optional(),
  whitelistedUsers: z.lazy(() => UserUncheckedUpdateManyWithoutAllowedVenuesNestedInputSchema).optional(),
  cameras: z.lazy(() => CameraUncheckedUpdateManyWithoutVenueNestedInputSchema).optional()
}).strict();

export const VenueUncheckedUpdateManyWithoutBannedVenuesInputSchema: z.ZodType<Prisma.VenueUncheckedUpdateManyWithoutBannedVenuesInput> = z.object({
  venueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  doorsOpeningTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  doorsAutoOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  doorsManuallyOpened: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  streamAutoStart: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyStarted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  streamManuallyEnded: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  visibility: z.union([ z.lazy(() => VisibilitySchema),z.lazy(() => EnumVisibilityFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraCreateManyVenueInputSchema: z.ZodType<Prisma.CameraCreateManyVenueInput> = z.object({
  cameraId: z.string().optional(),
  name: z.string(),
  senderId: z.string().optional().nullable(),
  cameraType: z.lazy(() => CameraTypeSchema).optional(),
  viewOriginX: z.number().optional(),
  viewOriginY: z.number().optional(),
  fovStart: z.number().optional(),
  fovEnd: z.number().optional(),
  orientation: z.number().optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const UserUpdateWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithoutOwnedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  allowedVenues: z.lazy(() => VenueUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutOwnedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutOwnedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateManyWithoutOwnersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutOwnersInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUpdateWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithoutAllowedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUpdateManyWithoutOwnersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutAllowedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAllowedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutOwnersNestedInputSchema).optional(),
  bannedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutBlackListedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateManyWithoutWhitelistedUsersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutWhitelistedUsersInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUpdateWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUpdateWithoutBannedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUpdateManyWithoutOwnersNestedInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutBannedVenuesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutBannedVenuesInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  ownedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutOwnersNestedInputSchema).optional(),
  allowedVenues: z.lazy(() => VenueUncheckedUpdateManyWithoutWhitelistedUsersNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateManyWithoutBlackListedUsersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyWithoutBlackListedUsersInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  password: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraUpdateWithoutVenueInputSchema: z.ZodType<Prisma.CameraUpdateWithoutVenueInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutFromCameraNestedInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraUncheckedUpdateWithoutVenueInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateWithoutVenueInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  cameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutFromCameraNestedInputSchema).optional(),
  fromCameraPortals: z.lazy(() => CameraPortalUncheckedUpdateManyWithoutToCameraNestedInputSchema).optional()
}).strict();

export const CameraUncheckedUpdateManyWithoutCamerasInputSchema: z.ZodType<Prisma.CameraUncheckedUpdateManyWithoutCamerasInput> = z.object({
  cameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  senderId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  cameraType: z.union([ z.lazy(() => CameraTypeSchema),z.lazy(() => EnumCameraTypeFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginX: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  viewOriginY: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovStart: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fovEnd: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  orientation: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  settings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
}).strict();

export const VirtualSpaceCreateManyVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceCreateManyVirtualSpace3DModelInput> = z.object({
  vrId: z.string().optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.string()
}).strict();

export const VirtualSpaceUpdateWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUpdateWithoutVirtualSpace3DModelInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  venue: z.lazy(() => VenueUpdateOneRequiredWithoutVirtualSpaceNestedInputSchema).optional()
}).strict();

export const VirtualSpaceUncheckedUpdateWithoutVirtualSpace3DModelInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateWithoutVirtualSpace3DModelInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const VirtualSpaceUncheckedUpdateManyWithoutVirtualSpacesInputSchema: z.ZodType<Prisma.VirtualSpaceUncheckedUpdateManyWithoutVirtualSpacesInput> = z.object({
  vrId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  extraSettings: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValue ]).optional(),
  ownerVenueId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalCreateManyFromCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateManyFromCameraInput> = z.object({
  x: z.number(),
  y: z.number(),
  distance: z.number(),
  toCameraId: z.string()
}).strict();

export const CameraPortalCreateManyToCameraInputSchema: z.ZodType<Prisma.CameraPortalCreateManyToCameraInput> = z.object({
  fromCameraId: z.string(),
  x: z.number(),
  y: z.number(),
  distance: z.number()
}).strict();

export const CameraPortalUpdateWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateWithoutFromCameraInput> = z.object({
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCamera: z.lazy(() => CameraUpdateOneRequiredWithoutFromCameraPortalsNestedInputSchema).optional()
}).strict();

export const CameraPortalUncheckedUpdateWithoutFromCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateWithoutFromCameraInput> = z.object({
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateManyWithoutCameraPortalsInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateManyWithoutCameraPortalsInput> = z.object({
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  toCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalUpdateWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUpdateWithoutToCameraInput> = z.object({
  fromCamera: z.lazy(() => CameraUpdateOneRequiredWithoutCameraPortalsNestedInputSchema).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateWithoutToCameraInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateWithoutToCameraInput> = z.object({
  fromCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const CameraPortalUncheckedUpdateManyWithoutFromCameraPortalsInputSchema: z.ZodType<Prisma.CameraPortalUncheckedUpdateManyWithoutFromCameraPortalsInput> = z.object({
  fromCameraId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  x: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  y: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  distance: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const SessionFindFirstArgsSchema: z.ZodType<Prisma.SessionFindFirstArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereInputSchema.optional(),
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(),SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: SessionScalarFieldEnumSchema.array().optional(),
}).strict()

export const SessionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SessionFindFirstOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereInputSchema.optional(),
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(),SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: SessionScalarFieldEnumSchema.array().optional(),
}).strict()

export const SessionFindManyArgsSchema: z.ZodType<Prisma.SessionFindManyArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereInputSchema.optional(),
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(),SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: SessionScalarFieldEnumSchema.array().optional(),
}).strict()

export const SessionAggregateArgsSchema: z.ZodType<Prisma.SessionAggregateArgs> = z.object({
  where: SessionWhereInputSchema.optional(),
  orderBy: z.union([ SessionOrderByWithRelationInputSchema.array(),SessionOrderByWithRelationInputSchema ]).optional(),
  cursor: SessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const SessionGroupByArgsSchema: z.ZodType<Prisma.SessionGroupByArgs> = z.object({
  where: SessionWhereInputSchema.optional(),
  orderBy: z.union([ SessionOrderByWithAggregationInputSchema.array(),SessionOrderByWithAggregationInputSchema ]).optional(),
  by: SessionScalarFieldEnumSchema.array(),
  having: SessionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const SessionFindUniqueArgsSchema: z.ZodType<Prisma.SessionFindUniqueArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereUniqueInputSchema,
}).strict()

export const SessionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SessionFindUniqueOrThrowArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereUniqueInputSchema,
}).strict()

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: UserScalarFieldEnumSchema.array().optional(),
}).strict()

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: UserScalarFieldEnumSchema.array().optional(),
}).strict()

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: UserScalarFieldEnumSchema.array().optional(),
}).strict()

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict()

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict()

export const VenueFindFirstArgsSchema: z.ZodType<Prisma.VenueFindFirstArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereInputSchema.optional(),
  orderBy: z.union([ VenueOrderByWithRelationInputSchema.array(),VenueOrderByWithRelationInputSchema ]).optional(),
  cursor: VenueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VenueScalarFieldEnumSchema.array().optional(),
}).strict()

export const VenueFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VenueFindFirstOrThrowArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereInputSchema.optional(),
  orderBy: z.union([ VenueOrderByWithRelationInputSchema.array(),VenueOrderByWithRelationInputSchema ]).optional(),
  cursor: VenueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VenueScalarFieldEnumSchema.array().optional(),
}).strict()

export const VenueFindManyArgsSchema: z.ZodType<Prisma.VenueFindManyArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereInputSchema.optional(),
  orderBy: z.union([ VenueOrderByWithRelationInputSchema.array(),VenueOrderByWithRelationInputSchema ]).optional(),
  cursor: VenueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VenueScalarFieldEnumSchema.array().optional(),
}).strict()

export const VenueAggregateArgsSchema: z.ZodType<Prisma.VenueAggregateArgs> = z.object({
  where: VenueWhereInputSchema.optional(),
  orderBy: z.union([ VenueOrderByWithRelationInputSchema.array(),VenueOrderByWithRelationInputSchema ]).optional(),
  cursor: VenueWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VenueGroupByArgsSchema: z.ZodType<Prisma.VenueGroupByArgs> = z.object({
  where: VenueWhereInputSchema.optional(),
  orderBy: z.union([ VenueOrderByWithAggregationInputSchema.array(),VenueOrderByWithAggregationInputSchema ]).optional(),
  by: VenueScalarFieldEnumSchema.array(),
  having: VenueScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VenueFindUniqueArgsSchema: z.ZodType<Prisma.VenueFindUniqueArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereUniqueInputSchema,
}).strict()

export const VenueFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VenueFindUniqueOrThrowArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereUniqueInputSchema,
}).strict()

export const VirtualSpaceFindFirstArgsSchema: z.ZodType<Prisma.VirtualSpaceFindFirstArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpaceOrderByWithRelationInputSchema.array(),VirtualSpaceOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpaceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpaceScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpaceFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VirtualSpaceFindFirstOrThrowArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpaceOrderByWithRelationInputSchema.array(),VirtualSpaceOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpaceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpaceScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpaceFindManyArgsSchema: z.ZodType<Prisma.VirtualSpaceFindManyArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpaceOrderByWithRelationInputSchema.array(),VirtualSpaceOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpaceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpaceScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpaceAggregateArgsSchema: z.ZodType<Prisma.VirtualSpaceAggregateArgs> = z.object({
  where: VirtualSpaceWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpaceOrderByWithRelationInputSchema.array(),VirtualSpaceOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpaceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VirtualSpaceGroupByArgsSchema: z.ZodType<Prisma.VirtualSpaceGroupByArgs> = z.object({
  where: VirtualSpaceWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpaceOrderByWithAggregationInputSchema.array(),VirtualSpaceOrderByWithAggregationInputSchema ]).optional(),
  by: VirtualSpaceScalarFieldEnumSchema.array(),
  having: VirtualSpaceScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VirtualSpaceFindUniqueArgsSchema: z.ZodType<Prisma.VirtualSpaceFindUniqueArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereUniqueInputSchema,
}).strict()

export const VirtualSpaceFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VirtualSpaceFindUniqueOrThrowArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereUniqueInputSchema,
}).strict()

export const VirtualSpace3DModelFindFirstArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelFindFirstArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpace3DModelOrderByWithRelationInputSchema.array(),VirtualSpace3DModelOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpace3DModelWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpace3DModelScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpace3DModelFindFirstOrThrowArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelFindFirstOrThrowArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpace3DModelOrderByWithRelationInputSchema.array(),VirtualSpace3DModelOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpace3DModelWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpace3DModelScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpace3DModelFindManyArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelFindManyArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpace3DModelOrderByWithRelationInputSchema.array(),VirtualSpace3DModelOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpace3DModelWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: VirtualSpace3DModelScalarFieldEnumSchema.array().optional(),
}).strict()

export const VirtualSpace3DModelAggregateArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelAggregateArgs> = z.object({
  where: VirtualSpace3DModelWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpace3DModelOrderByWithRelationInputSchema.array(),VirtualSpace3DModelOrderByWithRelationInputSchema ]).optional(),
  cursor: VirtualSpace3DModelWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VirtualSpace3DModelGroupByArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelGroupByArgs> = z.object({
  where: VirtualSpace3DModelWhereInputSchema.optional(),
  orderBy: z.union([ VirtualSpace3DModelOrderByWithAggregationInputSchema.array(),VirtualSpace3DModelOrderByWithAggregationInputSchema ]).optional(),
  by: VirtualSpace3DModelScalarFieldEnumSchema.array(),
  having: VirtualSpace3DModelScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const VirtualSpace3DModelFindUniqueArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelFindUniqueArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereUniqueInputSchema,
}).strict()

export const VirtualSpace3DModelFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelFindUniqueOrThrowArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereUniqueInputSchema,
}).strict()

export const CameraFindFirstArgsSchema: z.ZodType<Prisma.CameraFindFirstArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereInputSchema.optional(),
  orderBy: z.union([ CameraOrderByWithRelationInputSchema.array(),CameraOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CameraFindFirstOrThrowArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereInputSchema.optional(),
  orderBy: z.union([ CameraOrderByWithRelationInputSchema.array(),CameraOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraFindManyArgsSchema: z.ZodType<Prisma.CameraFindManyArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereInputSchema.optional(),
  orderBy: z.union([ CameraOrderByWithRelationInputSchema.array(),CameraOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraAggregateArgsSchema: z.ZodType<Prisma.CameraAggregateArgs> = z.object({
  where: CameraWhereInputSchema.optional(),
  orderBy: z.union([ CameraOrderByWithRelationInputSchema.array(),CameraOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const CameraGroupByArgsSchema: z.ZodType<Prisma.CameraGroupByArgs> = z.object({
  where: CameraWhereInputSchema.optional(),
  orderBy: z.union([ CameraOrderByWithAggregationInputSchema.array(),CameraOrderByWithAggregationInputSchema ]).optional(),
  by: CameraScalarFieldEnumSchema.array(),
  having: CameraScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const CameraFindUniqueArgsSchema: z.ZodType<Prisma.CameraFindUniqueArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereUniqueInputSchema,
}).strict()

export const CameraFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CameraFindUniqueOrThrowArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereUniqueInputSchema,
}).strict()

export const CameraPortalFindFirstArgsSchema: z.ZodType<Prisma.CameraPortalFindFirstArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereInputSchema.optional(),
  orderBy: z.union([ CameraPortalOrderByWithRelationInputSchema.array(),CameraPortalOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraPortalWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraPortalScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraPortalFindFirstOrThrowArgsSchema: z.ZodType<Prisma.CameraPortalFindFirstOrThrowArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereInputSchema.optional(),
  orderBy: z.union([ CameraPortalOrderByWithRelationInputSchema.array(),CameraPortalOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraPortalWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraPortalScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraPortalFindManyArgsSchema: z.ZodType<Prisma.CameraPortalFindManyArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereInputSchema.optional(),
  orderBy: z.union([ CameraPortalOrderByWithRelationInputSchema.array(),CameraPortalOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraPortalWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: CameraPortalScalarFieldEnumSchema.array().optional(),
}).strict()

export const CameraPortalAggregateArgsSchema: z.ZodType<Prisma.CameraPortalAggregateArgs> = z.object({
  where: CameraPortalWhereInputSchema.optional(),
  orderBy: z.union([ CameraPortalOrderByWithRelationInputSchema.array(),CameraPortalOrderByWithRelationInputSchema ]).optional(),
  cursor: CameraPortalWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const CameraPortalGroupByArgsSchema: z.ZodType<Prisma.CameraPortalGroupByArgs> = z.object({
  where: CameraPortalWhereInputSchema.optional(),
  orderBy: z.union([ CameraPortalOrderByWithAggregationInputSchema.array(),CameraPortalOrderByWithAggregationInputSchema ]).optional(),
  by: CameraPortalScalarFieldEnumSchema.array(),
  having: CameraPortalScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict()

export const CameraPortalFindUniqueArgsSchema: z.ZodType<Prisma.CameraPortalFindUniqueArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereUniqueInputSchema,
}).strict()

export const CameraPortalFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.CameraPortalFindUniqueOrThrowArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereUniqueInputSchema,
}).strict()

export const SessionCreateArgsSchema: z.ZodType<Prisma.SessionCreateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  data: z.union([ SessionCreateInputSchema,SessionUncheckedCreateInputSchema ]),
}).strict()

export const SessionUpsertArgsSchema: z.ZodType<Prisma.SessionUpsertArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereUniqueInputSchema,
  create: z.union([ SessionCreateInputSchema,SessionUncheckedCreateInputSchema ]),
  update: z.union([ SessionUpdateInputSchema,SessionUncheckedUpdateInputSchema ]),
}).strict()

export const SessionCreateManyArgsSchema: z.ZodType<Prisma.SessionCreateManyArgs> = z.object({
  data: SessionCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const SessionDeleteArgsSchema: z.ZodType<Prisma.SessionDeleteArgs> = z.object({
  select: SessionSelectSchema.optional(),
  where: SessionWhereUniqueInputSchema,
}).strict()

export const SessionUpdateArgsSchema: z.ZodType<Prisma.SessionUpdateArgs> = z.object({
  select: SessionSelectSchema.optional(),
  data: z.union([ SessionUpdateInputSchema,SessionUncheckedUpdateInputSchema ]),
  where: SessionWhereUniqueInputSchema,
}).strict()

export const SessionUpdateManyArgsSchema: z.ZodType<Prisma.SessionUpdateManyArgs> = z.object({
  data: z.union([ SessionUpdateManyMutationInputSchema,SessionUncheckedUpdateManyInputSchema ]),
  where: SessionWhereInputSchema.optional(),
}).strict()

export const SessionDeleteManyArgsSchema: z.ZodType<Prisma.SessionDeleteManyArgs> = z.object({
  where: SessionWhereInputSchema.optional(),
}).strict()

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict()

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
}).strict()

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: UserCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict()

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
}).strict()

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
}).strict()

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
}).strict()

export const VenueCreateArgsSchema: z.ZodType<Prisma.VenueCreateArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  data: z.union([ VenueCreateInputSchema,VenueUncheckedCreateInputSchema ]),
}).strict()

export const VenueUpsertArgsSchema: z.ZodType<Prisma.VenueUpsertArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereUniqueInputSchema,
  create: z.union([ VenueCreateInputSchema,VenueUncheckedCreateInputSchema ]),
  update: z.union([ VenueUpdateInputSchema,VenueUncheckedUpdateInputSchema ]),
}).strict()

export const VenueCreateManyArgsSchema: z.ZodType<Prisma.VenueCreateManyArgs> = z.object({
  data: VenueCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const VenueDeleteArgsSchema: z.ZodType<Prisma.VenueDeleteArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  where: VenueWhereUniqueInputSchema,
}).strict()

export const VenueUpdateArgsSchema: z.ZodType<Prisma.VenueUpdateArgs> = z.object({
  select: VenueSelectSchema.optional(),
  include: VenueIncludeSchema.optional(),
  data: z.union([ VenueUpdateInputSchema,VenueUncheckedUpdateInputSchema ]),
  where: VenueWhereUniqueInputSchema,
}).strict()

export const VenueUpdateManyArgsSchema: z.ZodType<Prisma.VenueUpdateManyArgs> = z.object({
  data: z.union([ VenueUpdateManyMutationInputSchema,VenueUncheckedUpdateManyInputSchema ]),
  where: VenueWhereInputSchema.optional(),
}).strict()

export const VenueDeleteManyArgsSchema: z.ZodType<Prisma.VenueDeleteManyArgs> = z.object({
  where: VenueWhereInputSchema.optional(),
}).strict()

export const VirtualSpaceCreateArgsSchema: z.ZodType<Prisma.VirtualSpaceCreateArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  data: z.union([ VirtualSpaceCreateInputSchema,VirtualSpaceUncheckedCreateInputSchema ]),
}).strict()

export const VirtualSpaceUpsertArgsSchema: z.ZodType<Prisma.VirtualSpaceUpsertArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereUniqueInputSchema,
  create: z.union([ VirtualSpaceCreateInputSchema,VirtualSpaceUncheckedCreateInputSchema ]),
  update: z.union([ VirtualSpaceUpdateInputSchema,VirtualSpaceUncheckedUpdateInputSchema ]),
}).strict()

export const VirtualSpaceCreateManyArgsSchema: z.ZodType<Prisma.VirtualSpaceCreateManyArgs> = z.object({
  data: VirtualSpaceCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const VirtualSpaceDeleteArgsSchema: z.ZodType<Prisma.VirtualSpaceDeleteArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  where: VirtualSpaceWhereUniqueInputSchema,
}).strict()

export const VirtualSpaceUpdateArgsSchema: z.ZodType<Prisma.VirtualSpaceUpdateArgs> = z.object({
  select: VirtualSpaceSelectSchema.optional(),
  include: VirtualSpaceIncludeSchema.optional(),
  data: z.union([ VirtualSpaceUpdateInputSchema,VirtualSpaceUncheckedUpdateInputSchema ]),
  where: VirtualSpaceWhereUniqueInputSchema,
}).strict()

export const VirtualSpaceUpdateManyArgsSchema: z.ZodType<Prisma.VirtualSpaceUpdateManyArgs> = z.object({
  data: z.union([ VirtualSpaceUpdateManyMutationInputSchema,VirtualSpaceUncheckedUpdateManyInputSchema ]),
  where: VirtualSpaceWhereInputSchema.optional(),
}).strict()

export const VirtualSpaceDeleteManyArgsSchema: z.ZodType<Prisma.VirtualSpaceDeleteManyArgs> = z.object({
  where: VirtualSpaceWhereInputSchema.optional(),
}).strict()

export const VirtualSpace3DModelCreateArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  data: z.union([ VirtualSpace3DModelCreateInputSchema,VirtualSpace3DModelUncheckedCreateInputSchema ]),
}).strict()

export const VirtualSpace3DModelUpsertArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelUpsertArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereUniqueInputSchema,
  create: z.union([ VirtualSpace3DModelCreateInputSchema,VirtualSpace3DModelUncheckedCreateInputSchema ]),
  update: z.union([ VirtualSpace3DModelUpdateInputSchema,VirtualSpace3DModelUncheckedUpdateInputSchema ]),
}).strict()

export const VirtualSpace3DModelCreateManyArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelCreateManyArgs> = z.object({
  data: VirtualSpace3DModelCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const VirtualSpace3DModelDeleteArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelDeleteArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  where: VirtualSpace3DModelWhereUniqueInputSchema,
}).strict()

export const VirtualSpace3DModelUpdateArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateArgs> = z.object({
  select: VirtualSpace3DModelSelectSchema.optional(),
  include: VirtualSpace3DModelIncludeSchema.optional(),
  data: z.union([ VirtualSpace3DModelUpdateInputSchema,VirtualSpace3DModelUncheckedUpdateInputSchema ]),
  where: VirtualSpace3DModelWhereUniqueInputSchema,
}).strict()

export const VirtualSpace3DModelUpdateManyArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelUpdateManyArgs> = z.object({
  data: z.union([ VirtualSpace3DModelUpdateManyMutationInputSchema,VirtualSpace3DModelUncheckedUpdateManyInputSchema ]),
  where: VirtualSpace3DModelWhereInputSchema.optional(),
}).strict()

export const VirtualSpace3DModelDeleteManyArgsSchema: z.ZodType<Prisma.VirtualSpace3DModelDeleteManyArgs> = z.object({
  where: VirtualSpace3DModelWhereInputSchema.optional(),
}).strict()

export const CameraCreateArgsSchema: z.ZodType<Prisma.CameraCreateArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  data: z.union([ CameraCreateInputSchema,CameraUncheckedCreateInputSchema ]),
}).strict()

export const CameraUpsertArgsSchema: z.ZodType<Prisma.CameraUpsertArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereUniqueInputSchema,
  create: z.union([ CameraCreateInputSchema,CameraUncheckedCreateInputSchema ]),
  update: z.union([ CameraUpdateInputSchema,CameraUncheckedUpdateInputSchema ]),
}).strict()

export const CameraCreateManyArgsSchema: z.ZodType<Prisma.CameraCreateManyArgs> = z.object({
  data: CameraCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const CameraDeleteArgsSchema: z.ZodType<Prisma.CameraDeleteArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  where: CameraWhereUniqueInputSchema,
}).strict()

export const CameraUpdateArgsSchema: z.ZodType<Prisma.CameraUpdateArgs> = z.object({
  select: CameraSelectSchema.optional(),
  include: CameraIncludeSchema.optional(),
  data: z.union([ CameraUpdateInputSchema,CameraUncheckedUpdateInputSchema ]),
  where: CameraWhereUniqueInputSchema,
}).strict()

export const CameraUpdateManyArgsSchema: z.ZodType<Prisma.CameraUpdateManyArgs> = z.object({
  data: z.union([ CameraUpdateManyMutationInputSchema,CameraUncheckedUpdateManyInputSchema ]),
  where: CameraWhereInputSchema.optional(),
}).strict()

export const CameraDeleteManyArgsSchema: z.ZodType<Prisma.CameraDeleteManyArgs> = z.object({
  where: CameraWhereInputSchema.optional(),
}).strict()

export const CameraPortalCreateArgsSchema: z.ZodType<Prisma.CameraPortalCreateArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  data: z.union([ CameraPortalCreateInputSchema,CameraPortalUncheckedCreateInputSchema ]),
}).strict()

export const CameraPortalUpsertArgsSchema: z.ZodType<Prisma.CameraPortalUpsertArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereUniqueInputSchema,
  create: z.union([ CameraPortalCreateInputSchema,CameraPortalUncheckedCreateInputSchema ]),
  update: z.union([ CameraPortalUpdateInputSchema,CameraPortalUncheckedUpdateInputSchema ]),
}).strict()

export const CameraPortalCreateManyArgsSchema: z.ZodType<Prisma.CameraPortalCreateManyArgs> = z.object({
  data: CameraPortalCreateManyInputSchema.array(),
  skipDuplicates: z.boolean().optional(),
}).strict()

export const CameraPortalDeleteArgsSchema: z.ZodType<Prisma.CameraPortalDeleteArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  where: CameraPortalWhereUniqueInputSchema,
}).strict()

export const CameraPortalUpdateArgsSchema: z.ZodType<Prisma.CameraPortalUpdateArgs> = z.object({
  select: CameraPortalSelectSchema.optional(),
  include: CameraPortalIncludeSchema.optional(),
  data: z.union([ CameraPortalUpdateInputSchema,CameraPortalUncheckedUpdateInputSchema ]),
  where: CameraPortalWhereUniqueInputSchema,
}).strict()

export const CameraPortalUpdateManyArgsSchema: z.ZodType<Prisma.CameraPortalUpdateManyArgs> = z.object({
  data: z.union([ CameraPortalUpdateManyMutationInputSchema,CameraPortalUncheckedUpdateManyInputSchema ]),
  where: CameraPortalWhereInputSchema.optional(),
}).strict()

export const CameraPortalDeleteManyArgsSchema: z.ZodType<Prisma.CameraPortalDeleteManyArgs> = z.object({
  where: CameraPortalWhereInputSchema.optional(),
}).strict()