import express, { json as parseJsonBody } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { createJwt, verifyJwtToken } from 'shared-modules/jwtUtils';
import createUserRouter from './userRoutes';
import {default as Haikunator} from 'haikunator';
import wordlist from './haikunator-wordlist';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma from './prismaClient';
// import createApiRouter from './apiRoutes';
import { JwtUserData, UserIdSchema } from 'schemas';

const haikunator = new Haikunator({
  adjectives: wordlist.adjectives,
  nouns: wordlist.nouns,
  defaults: { tokenLength: 2 }
});



// console.log('environment: ', process.env);
const devMode = process.env.DEVELOPMENT;

const app = express();


// We need to trust first proxy. Foremost to get secure cookie to function  properly
app.set('trust proxy', 1);

// TODO: We should not allow reading cookie from javascript.
// Find a way to make our auth flow work without this set to false
let cookieHttpOnly = false;
let cookieSecure = true;
if (devMode) {
  // NOTE: I couldnt come up with a way to allow all origins so we have hardcoded the devservers url here
  const devServerUrl = 'http://localhost:5173';
  console.log('allowing cors for development: ', devServerUrl);
  app.use(cors({ credentials: true, origin: [devServerUrl] }));

  console.log('allowing cookie despite not https');
  cookieHttpOnly = false;
  cookieSecure = false;
} else {
  if (!process.env.EXPOSED_SERVER_URL) {
    console.error('no EXPOSED_SERVER_URL provided from env');
    process.exit(1);
  }
  console.log('restricting CORS for production');
  app.use(cors({
    origin: [process.env.EXPOSED_SERVER_URL],
    credentials: true
  }));
}

app.use((req, res, next) => {
  return parseJsonBody()(req, res, (err) => {
    if (err) {
      //There was error!!
      const msg = extractMessageFromCatch(err, 'failed to parse your shitty request!');
      res.status(400).send(`You suck!!! ${msg}`);
    } else {
      next();
    }
  });
});

if (!process.env.SESSION_KEY) {
  console.error('no session key provided!!!');
  throw new Error('no session key provided when starting api server');
}


const prismaSessionStore = new PrismaSessionStore(prisma, {
  checkPeriod: 2 * 60 * 1000,
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
});
app.use(session({
  secret: process.env.SESSION_KEY,
  cookie: {
    httpOnly: cookieHttpOnly,
    secure: cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000 // ms
  },
  name: process.env.EXPOSED_PROJECT_NAME,
  resave: false,
  saveUninitialized: false,
  store: prismaSessionStore
}),
);
const userRouter = createUserRouter();
app.use('/user/', userRouter);

// const apiRouter = createApiRouter();
// app.use('/', apiRouter);


app.get('/health', (req, res) => {
  res.status(200).send({
    message: 'I am Healthy! time:' + Date.now(),
  });
});

app.get('/guest-jwt', (req, res) => {

  let haikuName = haikunator.haikunate();
  let userId = UserIdSchema.parse(randomUUID());
  if(req.query && req.query['prevToken']){
    try {

      const previousToken = req.query['prevToken'];
      if(typeof previousToken !== 'string'){
        throw new Error('the old token you provided was invalid! Please stop this madness😥😥');
      }
      const decoded = verifyJwtToken(previousToken);
      if(decoded.role !== 'guest'){
        throw new Error('only guests can refresh tokens using the previous one');
      }
      userId = decoded.userId;
      haikuName = decoded.username;
    } catch(e){
      console.error((e as Error).message);
      res.status(400).send('no bueno! The old token you gave was no good');
      return;
    }
  }
  if(req.query && req.query['username']){
    try {
      const requestedName = req.query['username'];
      if(typeof requestedName !== 'string'){
        throw new Error('invalid username provided! Please stop this madness😥😥');
      }
      haikuName = requestedName;
    } catch(e: unknown){
      console.error((e as Error).message);
      // console.error('failed to parse incoming jwt, is it expired?');
      res.status(400).send('failed. Did you supply a malformed username?');
      return;
    }
  }
  const guestObject: JwtUserData = {
    username: haikuName,
    role: 'guest',
    userId,
  };
  console.log('sending a guest jwt:', guestObject);
  const jwt = createJwt(guestObject, 120);
  
  //TEMP DEBUG 
  // const expSecondsTimestamp = verifyJwtToken(jwt).exp?? Infinity;
  // console.log('created guestJwt that expires:', expSecondsTimestamp);
  // const now = Date.now();
  // const dt = new Date().toUTCString();
  // console.log('UTC now:', dt);
  // console.log('now is: ', now);
  // console.log('jwt expires in (millis): ', expSecondsTimestamp*1000 - now );
  
  res.send(jwt);
});


const port = Number.parseInt(process.env.AUTH_PORT || '3333');
app.listen(port, () => {
  console.log(`listening on ${port}`);
  if (process.env.DEVELOPMENT)
    console.log('Running in DEVELOPMENT mode!!!');
  else
    console.log('Running in PRODUCTION mode');
});
