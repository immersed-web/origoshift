import { RequestHandler, Router } from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma, { Prisma } from './prismaSingleton';

declare module 'express-session' {
  interface SessionData {
    userId: string
  }
}


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

  userRouter.get('', (req, res) => {
    res.send({message: 'this is the auth user route. Whats cookin good lookin?'});
  });
    
  userRouter.post('/create', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await prisma.user.create({data: {username: username, role: {connectOrCreate: {where:{role: 'client'}, create: {role: 'client'}}}, password: hashedPassword}});
    console.log('result:', result);

    res.status(201).send();
  });

  // userRouter.get('/dummylogin', (req, res) => {

  //   req.session.userId = 'mrMaster';
  //   res.send('niiice');
  // });
    
  userRouter.post('/login', async (req, res) => {
    console.log('login req received');
    const username = req.body.username;
    const password = req.body.password;
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
  
  });

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

  userRouter.get('/me', validateUserSession,  async (req, res, next) => {
    res.send(req.user);
  });

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