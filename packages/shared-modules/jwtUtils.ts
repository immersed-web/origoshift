
// import passport from 'passport';
// import {ExtractJwt, Strategy as JwtStrategy, StrategyOptions} from 'passport-jwt';
import Express from 'express';
import jwt, { JwtPayload} from 'jsonwebtoken';
import { UserData } from 'shared-types/CustomTypes';
import 'shared-types/augmentedRequest';

// passport.unuse('session');

// type User = Express.Request['user'];

declare module 'express' {
  interface Request {
    user?: UserData;
  }
}

if(!process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE || !process.env.JWT_SECRET){
  throw Error('missing Environment variables for jwt settings!!!');
}
const envJwtSecret = process.env.JWT_SECRET;

const jwtSignOptions: jwt.SignOptions = {
  // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
  // secretOrKey: JWT_SECRET,
  algorithm: 'HS256',
};

// passport.use('jwtStrategy', new JwtStrategy(jwtStrategyOptions, function(jwtPayload, done){
//   console.log('received valid jwt:', jwtPayload);
//   done(null, jwtPayload);
// }));

// export default function  initPassport(app: Express){
//   app.use(passport.initialize());
// }

export function createJwt(userObj: object | string | Buffer, expiresInSeconds: number | undefined = undefined, jwtId?: string, secret?: string){
  const signOptions: jwt.SignOptions = {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  };
  if(expiresInSeconds){
    signOptions.expiresIn = expiresInSeconds;
  }
  if(jwtId){
    signOptions.jwtid = jwtId;
  }
  if(!secret){
    secret = envJwtSecret;
  }
  const token = jwt.sign(userObj, secret, signOptions);

  return token;
}

export type DecodedJwt = UserData & JwtPayload;


export function verifyJwtToken(token: string, secret?: string){
  if(!secret){
    secret = envJwtSecret;
  }
  const decoded = jwt.verify(token, secret, jwtSignOptions);
  return decoded as DecodedJwt;
}

export const jwtMiddleware: Express.RequestHandler = (req, res, next) => {
  const authHeader = req.header('authorization');
  if(!authHeader?.startsWith('Bearer')){
    console.warn('Received an illformed authorization header');
    // next(false);
    res.status(403).send('illformed authorization header');
    return;
  }
  const token = authHeader.substring('Bearer '.length, authHeader.length);
  try{
    const decodedToken = verifyJwtToken(token);
      // req['user'] = decodedToken;
      req.user = decodedToken;
    return next();
  } catch (e){
    res.status(403).send('invalid token maddafakka!');
  }
};