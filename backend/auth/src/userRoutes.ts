import { RequestHandler, Router } from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma, { Prisma } from './prismaSingleton';
import { createJwt } from './jwtUtils';

declare module 'express-session' {
  interface SessionData {
    userId: string
  }
}

const index: RequestHandler = (req, res) => {
  res.send({message: 'this is the auth user route. Whats cookin good lookin?'});
};
const createUser: RequestHandler = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await prisma.user.create({data: {username: username, role: {connectOrCreate: {where:{role: 'client'}, create: {role: 'client'}}}, password: hashedPassword}});
  console.log('result:', result);

  res.status(201).send();
};

const validateUserSession: RequestHandler = async (req, res, next) => {
  if(!req.session.userId){
    res.status(403).send({message: 'fuck you!!!!'});
    return;
  }
  const user = await prisma.user.findUnique({
    where: {uuid: req.session.userId},
    select: {
      uuid: true,
      username: true,
      email: true,
      profile: true,
      role: true
    }
  });
  if(!user){
    console.warn('failed to get user!!!');
    next();
    return;
  }
  req.user = user;
  next();
};

const loginUser: RequestHandler = async (req, res) => {
  console.log('login req received');
  const username = req.body.username;
  const password = req.body.password;
  try{
    const foundUser = await prisma.user.findUnique({where: {username: username}});
    if(!foundUser){
      res.send('fuck you');
      return;
    }
    const correct = await bcrypt.compare(password, foundUser.password);
    if(correct){
      req.session.userId = foundUser.uuid;
      res.status(200).send();
    }
  } catch (e) {
    console.error(e);
    res.status(501).send('failed when querying db for user');
  }
  
};

const getUser: RequestHandler = async (req, res) => {
  res.send(req.user);
};

const getJwt:RequestHandler = async (req, res) => {
  if(!req.user){
    res.status(501).send('no user in req obj!');
    return;
  }
  const token = createJwt(req.user as Record<string, unknown>, 60);
  res.send(token);
};

function createUserRouter(env: NodeJS.ProcessEnv){

  if(!env.SESSION_KEY){
    console.error('no session key provided!!!');
    throw new Error('no session key provided when creating user router');
  }

  const userRouter = Router();
  
  // TODO: Make sure we use nice settings for the cookie!!! These are kind of arbitrary chosen
  userRouter.use(session({
    secret: env.SESSION_KEY,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // ms
    },
    name: 'inclubit',
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma,
      {
        checkPeriod: 2 * 60 * 1000, // ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      })
  }));

  userRouter.get('', index);
    
  userRouter.post('create', createUser);

  // userRouter.get('/dummylogin', (req, res) => {

  //   req.session.userId = 'mrMaster';
  //   res.send('niiice');
  // });
    
  userRouter.post('login', loginUser);


  userRouter.get('me', validateUserSession,  getUser);

  userRouter.get('jwt', validateUserSession, getJwt);

  // userRouter.get('jwt', async (req, res, next) =>{

  //   const query: Prisma.UserSelect = {
  //     uuid: true,
  //     role: true,

  //   }
    

  //   const user = await prisma.user.findUnique({where: {uuid: req.session.userId}});
    

  // });

  

  return userRouter;

}



export default createUserRouter;