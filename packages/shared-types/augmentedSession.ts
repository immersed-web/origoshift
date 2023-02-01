// import type {SessionData} from 'express-session';
// import type { UserData } from './CustomTypes.js';
import { JwtUserData } from 'schemas'

declare module 'express-session' {
  interface SessionData {
    userId: string
    user: JwtUserData
  }
}

export {}
