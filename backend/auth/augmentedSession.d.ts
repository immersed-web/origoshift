import 'express-session';
import { UserData } from 'shared-types/CustomTypes';

declare module 'express-session' {
  interface SessionData {
    userId: string
    user: UserData
  }
}
