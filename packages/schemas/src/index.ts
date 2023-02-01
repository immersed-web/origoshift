import { z } from 'zod';
import type { JwtPayload as JwtShapeFromLib } from 'jsonwebtoken'
import { Role } from "database";
import { objectKeys } from "ts-extras";

type RemoveIndex<T> = {
  [ K in keyof T as string extends K ? never : number extends K ? never : K ] : T[K]
};

type JWTDefaultPayload = RemoveIndex<JwtShapeFromLib>

type Implements<Model> = {
  [key in keyof Model]-?: undefined extends Model[key]
    ? null extends Model[key]
      ? z.ZodNullableType<z.ZodOptionalType<z.ZodType<Model[key]>>>
      : z.ZodOptionalType<z.ZodType<Model[key]>>
    : null extends Model[key]
    ? z.ZodNullableType<z.ZodType<Model[key]>>
    : z.ZodType<Model[key]>;
};

function implement<Model = never>() {
  return {
    with: <
      Schema extends Implements<Model> & {
        [unknownKey in Exclude<keyof Schema, keyof Model>]: never;
      }
    >(
      schema: Schema
    ) => z.object(schema),
  };
}

const jwtDefaultPayload = implement<JWTDefaultPayload>().with({
  aud: z.string().optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
  iss: z.string().optional(),
  jti: z.string().optional(),
  nbf: z.number().optional(),
  sub: z.string().optional(),
})

// TODO: I would really prefer to use a const literal tuple instead of prisma enum.
// That is. Could we in some way convert/extract a literal tuple from the prisma type and then use z.enum() instead of z.nativeEnum()
// Because then we could use the extracted literal tuple from prisma instead of defining it manually here. This is redundant and we need to keep them in sync
export const roleHierarchy = (['gunnar', 'superadmin', 'admin', 'moderator', 'user', 'guest'] as const) satisfies Readonly<Role[]>;

// const UserRoleSchema = z.enum(possibleUserRoles);
export const UserRoleSchema = z.enum(roleHierarchy);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const JwtUserDataSchema = z.object({
  uuid: z.string().uuid(),
  username: z.string(),
  role: UserRoleSchema,
})

export type JwtUserData = z.infer<typeof JwtUserDataSchema>;

export const JwtPayloadSchema = jwtDefaultPayload.merge(JwtUserDataSchema)
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

// export const UserDataSchema = z.object({
//   jwtToken: z.string(),
//   decodedJwt: JwtPayloadSchema,
// })
// export type UserData = z.infer<typeof UserDataSchema>

export const ClientPositionSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  orientation: z.tuple([z.number(), z.number(), z.number(), z.number()])
})

export type ClientPosition = z.infer<typeof ClientPositionSchema>;

export const ClientInfoSchema = z.object({
  uuid: z.string().uuid(),
  role: UserRoleSchema,
  position: z.optional(ClientPositionSchema)
})

export type ClientInfo = z.infer<typeof ClientInfoSchema>;
