import { RequestHandler, Router } from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma, {Prisma} from './prismaClient';
import { createJwt } from 'shared-modules/jwtUtils';
import { userDataFromDBResponse } from './utils';

const index: RequestHandler = (req, res) => {
  res.send({message: 'this is the auth user route. Whats cookin good lookin?'});
};
export const createUser: RequestHandler = async (req, res) => {
  const userData = req.session.user;
  
  if(userData?.role !== 'admin'){
    res.status(403).send('fuck you');
    return;
  }
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role?req.body.role: 'client';
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await prisma.user.create({data: {username: username, role: {connectOrCreate: {where:{role: role}, create: {role: role}}}, password: hashedPassword},select: {
      uuid: true,
      username: true,
      role: true,
      updatedAt: true,
    }});
    res.status(201).send(result);
    return;
  } catch(e) {
    if(e instanceof Prisma.PrismaClientKnownRequestError){
      if(e.code === 'P2002'){
        res.status(409).send({message: 'username already taken maddafakka!'});
        return;
      }else {
        console.error('prisma client error when creating user');
        console.error(e);
        res.status(501).send(e.message);
        return;
      }
    }
    console.warn(e);
  }

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
        const userData = userDataFromDBResponse(foundUser);
        // console.log('userdata:', userData);
        req.session.userId = userData.uuid;
        req.session.user = userData;
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
  if(!(req.session.user)){
    res.status(403).send('not allowed mr hacker!');
    return;
  }
  res.send(req.session.user);
};

export const getJwt:RequestHandler = async (req, res) => {
  if(!req.session.user){
    res.status(403).send('no user in req obj! Seems you are not logged in!');
    return;
  }
  const token = createJwt(req.session.user, 60);
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
    
  
  // userRouter.get('/dummylogin', (req, res) => {
    
  //   req.session.userId = 'mrMaster';
  //   res.send('niiice');
  // });
    
  userRouter.post('/login', loginUser);
  userRouter.get('/logout', logoutUser);
    
  userRouter.post('/create', validateUserSession, createUser);

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