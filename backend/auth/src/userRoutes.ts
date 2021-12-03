import { RequestHandler, Router } from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma  from './prismaClient';
import { createJwt } from './jwtUtils';
import { Prisma } from '@prisma/client';


const userWithRole = Prisma.validator<Prisma.UserArgs>()({include: {role: true}});
type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>
declare module 'express-session' {
  interface SessionData {
    userId: string
    user: UserWithRole
  }
}

const index: RequestHandler = (req, res) => {
  res.send({message: 'this is the auth user route. Whats cookin good lookin?'});
};
export const createUser: RequestHandler = async (req, res) => {
  const userData = req.session.user;
  
  if(userData?.role?.role === 'admin'){
    res.status(403).send('fuck you');
  }
  const username = req.body.username;
  const password = req.body.password;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await prisma.user.create({data: {username: username, role: {connectOrCreate: {where:{role: 'client'}, create: {role: 'client'}}}, password: hashedPassword}});

  res.status(201).send(result);
};


export const validateUserSession: RequestHandler = async (req, res, next) => {
  if(req.session.userId){
    // const user = await prisma.user.findUnique({
    //   where: {uuid: req.session.userId},
    //   select: {
    //     uuid: true,
    //     // username: true,
    //     // profile: true,
    //     // role: true
    //   }
    // });

    const user = await prisma.user.findUnique({where: {uuid: req.session.userId}, include:{ role: true}});
    if(user){
      // req.user = user;
      // req.session.user = user;
      next();
      return;
    }
  }
  res.status(403).send({message: 'fuck you!!!!'});
  return;
};

export const loginUser: RequestHandler = async (req, res) => {
  // console.log('login req received');
  const username = req.body.username;
  const password = req.body.password;
  try{
    const foundUser = await prisma.user.findUnique({where: {username: username}, include:{ role: true}});
    if(foundUser){
      const correct = await bcrypt.compare(password, foundUser.password);
      if(correct){
        req.session.userId = foundUser.uuid;
        req.session.user = foundUser;
        res.status(200).send();
        return;
      }
    }
  } catch (e) {
    console.error(e);
    res.status(501).send('failed when querying db for user');
    return;
  }
  res.status(403).send('fuck you');
  
};

export const logoutUser: RequestHandler = async (req, res) => {
  if(req.user){
    req.user = undefined;
  }
  if(req.session.userId){
    req.session.userId = undefined;
    req.session.destroy((err)=> {
      if(err){
        console.error(err);
        res.status(501).send({message: 'failed to destroy session'});
        return;
      }
    });
  }
  res.status(200).send();
};

export const getUser: RequestHandler = async (req, res) => {
  res.send(req.user);
};

export const getJwt:RequestHandler = async (req, res) => {
  if(!req.user){
    res.status(501).send('no user in req obj!');
    return;
  }
  const token = createJwt(req.user as Record<string, unknown>, 60);
  res.send(token);
};

export default function createUserRouter(env: NodeJS.ProcessEnv){
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
    
  userRouter.post('/create', createUser);

  // userRouter.get('/dummylogin', (req, res) => {

  //   req.session.userId = 'mrMaster';
  //   res.send('niiice');
  // });
    
  userRouter.post('/login', loginUser);
  userRouter.get('/logout', () => {
    console.log('logout requested');
  });


  userRouter.get('/me', validateUserSession,  getUser);

  userRouter.get('/jwt', validateUserSession, getJwt);

  // userRouter.get('jwt', async (req, res, next) =>{

  //   const query: Prisma.UserSelect = {
  //     uuid: true,
  //     role: true,

  //   }
    

  //   const user = await prisma.user.findUnique({where: {uuid: req.session.userId}});
    

  // });

  

  return userRouter;

}



// export default createUserRouter;