import express, { json as parseJsonBody, Request } from 'express';
import { createJwt, verifyJwtToken } from './jwtUtils';
// import passport from 'passport';
// import {} from 'passport-local';
// import { ExtractJwt, StrategyOptions } from 'passport-jwt';
// import jwt from 'jsonwebtoken';
// import passport from 'passport';
// import initPassport, {JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER} from './jwtUtils';


const app = express();
app.use(parseJsonBody());


const token = createJwt({gunnar: 'oledal', isccol: true, likes: ['food', 'skateboarding']}, 6000, 'asdfasdf');
console.log('token:', token);

try {
  const decoded = verifyJwtToken(token);
  console.log('decoded: ', decoded);
} catch(e){
  console.warn(e);

}