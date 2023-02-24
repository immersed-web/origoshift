import { JwtUserData } from 'schemas'

declare module 'express-session' {
  interface SessionData {
    userId: string
    user: JwtUserData
  }
}

export {}
