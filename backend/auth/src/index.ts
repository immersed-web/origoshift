import express, { json as parseJsonBody } from 'express';
import url from 'url';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { createJwt, verifyJwtToken } from 'shared-modules/jwtUtils';
// import { UserData } from 'shared-types/CustomTypes';
import createUserRouter from './userRoutes';
import {default as Haikunator} from 'haikunator';
import wordlist from './haikunator-wordlist';
import { extractMessageFromCatch } from 'shared-modules/utilFns';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma from './prismaClient';
// import createApiRouter from './apiRoutes';
import { JwtUserData } from 'schemas';
import { STATUS_CODES } from 'http';

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
  store: new PrismaSessionStore(prisma,
    {
      checkPeriod: 2 * 60 * 1000, // ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    })
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

// TODO: Right now guests will keep their assigned uuid and haikuname as long as they keep refreshing their token using the old one.
// But what if we want to allow them to change name? Perhaps the haikuname inside the jwt is only used initially, and then we rely on local storage?
// We shall see....
app.get('/guest-jwt', (req, res) => {
  const query = url.parse(req.url).query;
  let haikuName = haikunator.haikunate();
  let uuid = randomUUID();
  if(query){
    // console.log(`received query: ${query}`);
    try {
      const decodedToken = verifyJwtToken(query);
      uuid = decodedToken.uuid;
      haikuName = decodedToken.username;
    } catch(e: unknown){
      console.error((e as Error).message);
      // console.error('failed to parse incoming jwt, is it expired?');
      res.status(400).send('failed. Did you perhaps send an expired token?');
      return;
    }
  }
  const guestObject: JwtUserData = {
    username: haikuName,
    role: 'guest',
    uuid,
  };
  console.log('sending a guest jwt:', guestObject);
  const jwt = createJwt(guestObject, 60 * 2);
  res.send(jwt);
});


const port = 3333;
app.listen(port, () => {
  console.log(`listening on ${port}`);
  if (process.env.DEVELOPMENT)
    console.log('Running in dev mode!!!');
});
