import Express from 'express';
import jwt from 'jsonwebtoken';
import 'shared-types/augmentedRequest';
import { JwtPayloadSchema, JwtPayload, JwtUserData } from 'schemas';

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

export function createJwt(userObj: JwtUserData, expiresInSeconds: number | undefined = undefined, jwtId?: string, secret?: string){
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

export function verifyJwtToken(token: string, secret?: string){
  if(!secret){
    secret = envJwtSecret;
  }
  const decoded = jwt.verify(token, secret, jwtSignOptions);
  const validJwt: JwtPayload  = JwtPayloadSchema.parse(decoded);
  return validJwt;
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
    const jwtObject = verifyJwtToken(token);
    req.user = jwtObject;
    return next();
  } catch (e){
    res.status(403).send('invalid token maddafakka!');
  }
};
