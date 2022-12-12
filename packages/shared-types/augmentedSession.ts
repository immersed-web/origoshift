import type {SessionData} from 'express-session';
import type { UserData } from './CustomTypes.js';

declare module 'express-session' {
  interface SessionData {
    userId: string
    user: UserData
  }
}
