
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


export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'bajskorv';

// TODO: We must environmentify these variables!!!!!
export const JWT_SECRET = 'lkajsdhflkjasdjf';
export const JWT_ISSUER = 'Inclubit auth server';
export const JWT_AUDIENCE = 'inclubit application';

const jwtSignOptions: jwt.SignOptions = {
  // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
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
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
  if(expiresInSeconds){
    signOptions.expiresIn = expiresInSeconds;
  }
  if(jwtId){
    signOptions.jwtid = jwtId;
  }
  if(!secret){
    secret = JWT_SECRET;
  }
  const token = jwt.sign(userObj, secret, signOptions);

  return token;
}

export type DecodedJwt = UserData & JwtPayload;


export function verifyJwtToken(token: string, secret?: string){
  if(!secret){
    secret = JWT_SECRET;
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