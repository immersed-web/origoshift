import express, { json as parseJsonBody } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { createJwt } from 'shared-modules/jwtUtils';
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

let cookieHttpOnly = true;
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
  if (process.env.SERVER_URL) {
    console.log('restricting CORS for production');
    app.use(cors({
      origin: [process.env.SERVER_URL],
      credentials: true
    }));
  }
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
  name: 'origoshift',
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
  const userId = UserIdSchema.parse(randomUUID());
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
  const jwt = createJwt(guestObject, 5);
  res.send(jwt);
});


const port = 3333;
app.listen(port, () => {
  console.log(`listening on ${port}`);
  if (process.env.DEVELOPMENT)
    console.log('Running in dev mode!!!');
});
