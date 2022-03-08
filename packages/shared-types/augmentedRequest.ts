import {Express} from 'express-serve-static-core'
// import express from 'express'
// import { Express } from 'express'
import { UserData } from 'shared-types/CustomTypes';


// import 'mediasoup';
// namespace MediaSoup {
//   interface AppData {
//     producerInfo?: Record<string, unknown>
//   }
// }

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserData
  }
}