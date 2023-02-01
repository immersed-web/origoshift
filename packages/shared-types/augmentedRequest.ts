// import type {Request} from 'express-serve-static-core'
// import express from 'express'
// import type { Express, Request } from 'express'
// import type { UserData } from './CustomTypes.js';
import { JwtPayload } from 'schemas';



declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload
  }
}

// export {};
// declare global {
//   namespace Express {
//     export interface Request {
//       user?: import('./CustomTypes.js').UserData
//     }
//   }
// }

export {};
