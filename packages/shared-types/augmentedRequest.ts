import type {Request} from 'express-serve-static-core'
// import express from 'express'
// import type { Express, Request } from 'express'
import type { UserData } from './CustomTypes.js';



declare module 'express-serve-static-core' {
  interface Request {
    user?: UserData
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
