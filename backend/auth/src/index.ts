import express, { json as parseJsonBody } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { createJwt } from 'shared-modules/jwtUtils';
import { UserData } from 'shared-types/CustomTypes';
import createUserRouter from './userRoutes';
import Haikunator from 'haikunator';
import wordlist from './haikunator-wordlist';

const haikunator = new Haikunator({
  adjectives: wordlist.adjectives,
  nouns: wordlist.nouns,
  defaults: { tokenLength: 2 }
});

// console.log('environment: ', process.env);
const devMode = process.env.DEVELOPMENT;

const app = express();

if(devMode){
  console.log('allowing cors for frontend');
  app.use(cors({
    origin: ['http://localhost:8080'],
    credentials: true,
  }));
}

app.use(parseJsonBody());

const userRouter = createUserRouter(process.env);
app.use('/', userRouter);

app.get('/health', (req, res) => {
  res.status(200).send({
    message: 'I am Healthy! time:' + Date.now(),
  });
});

app.get('/guest-jwt', (req, res) => {
  const haikuName = haikunator.haikunate();
  const guestObject: UserData = {
    username: haikuName,
    role: 'guest',
    allowedActions: [],
    uuid: randomUUID(),
  };
  const jwt = createJwt(guestObject, 60);
  res.send(jwt);
});


const port = 3333;
app.listen(port, ()=> {
  console.log(`listening on ${port}`);
  if(process.env.DEVELOPMENT)
    console.log('Running in dev mode!!!');
});