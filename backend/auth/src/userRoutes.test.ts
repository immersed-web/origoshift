import { NextFunction, Request, Response, Router } from 'express';
import createUserRouter, {createUser, loginUser, getUser, getJwt, logoutUser, validateUserSession} from './userRoutes';
import { mock, mockDeep, mockFn } from 'jest-mock-extended';

import brcypt from 'bcrypt';
import { UserData } from 'shared-types/CustomTypes';

import { prismaMock, PrismaSessionStoreMock, UserWithRole, Prisma} from './testUtils/prismaMock';
import { userDataFromDBResponse } from './utils';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';


describe('when creating a userRouter', () => {
  it('prisma client has mocked api', () => {
    expect(jest.isMockFunction(prismaMock.user.findUnique)).toBeTruthy();
  });
  it('prisma session store is mock', () => {
    expect(jest.isMockFunction(PrismaSessionStoreMock)).toBeTruthy();
  });

  it('is created if provided env with session key present', () =>{
    const env: Partial<NodeJS.ProcessEnv> = {
      SESSION_KEY: 'aKeyForFakkSake',

    };
    const userRouter: Router = createUserRouter(env);
    expect(userRouter).toBeDefined();
  });
  it('throws if no session key is provided', ()=> {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    const env: Partial<NodeJS.ProcessEnv> = {};
    expect(() => createUserRouter(env)).toThrow();
    errorSpy.mockRestore();
  });
});

describe('a userRouter', () => {
  it('has all the required routes', () => {
    //TODO: make this test good. As of now, when failing we dont understand whyyyy
    const env: Partial<NodeJS.ProcessEnv> = {
      SESSION_KEY: 'bajskorv',
    };

    const requiredRoutes = [
      {path: '/create', method: 'post'},
      {path: '/login', method: 'post'},
      {path: '/logout', method: 'get'},
      {path: '/me', method: 'get'},
      {path: '/jwt', method: 'get'},
    ];
    const userRouter = createUserRouter(env);
    requiredRoutes.forEach(route => {
      const match = userRouter.stack.find(s => {
        if(!s.route){
          return false;
        }
        return s.route.path === route.path && s.route.methods[route.method];
      });
      expect(match).toBeTruthy();
    });
    
  });
});

// describe('a mocked userRouter', ()=>{
//   const getSpy = jest.fn();
//   const postSpy = jest.fn();
//   jest.doMock('express', () => {
//     return {
//       __esModule: true,
//       Router() {
//         return {
//           get: getSpy,
//           post: postSpy, 
//         };
//       }
//     };
//   });
//   beforeEach(() => {
//     getSpy.mockReset();
//     postSpy.mockReset();
//   });

//   it('');
// });

describe('the userRouter middlewares', () =>{
  // const userWithRole = Prisma.validator<Prisma.UserArgs>()({include: {role: true}});
  // type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>
  const mockedUserWithoutRole = {
    username: 'mrOizo',
    password: 'passw0rd',
    uuid: '123',
    roleId: null,
    updatedAt: new Date(),
  };
  const mockedUserWithRole: UserWithRole = {
    username: 'userMan',
    password: 'p4$$w0rd',
    uuid: '123',
    updatedAt: new Date(),
    roleId: 1,
    role: {
      id: 1,
      role: 'client'
    }
  };

  const mockedUserData: UserData = {
    uuid: '123',
    username: 'mr test',
    role: 'client'
  };
  
  const req = mockDeep<Request>();

  const res = mock<Response>();
  res.status.mockReturnValue(res);
  const next = mockFn<NextFunction>();
  beforeEach(() => {
    res.status.mockClear();
    res.send.mockClear();
  });

  describe('loginUser', ()=> {
    let hashedPassword: string;
    
    beforeEach(async ()=> {
      req.body = {
        username: 'testuser',
        password: 'bajskorv',
      };
      hashedPassword = await brcypt.hash(req.body.password, 10);
    });
    
    it('logs in valid user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        username: req.body.username, 
        password: hashedPassword, 
        updatedAt: new Date(), 
        uuid: '123', 
        roleId: null,
      });
      await loginUser(req, res, next);
      expect(req.session.userId).toBeDefined();
      expect(req.user).toBeDefined();
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledTimes(1);
    });
    
    it('sends 403 if username is not found', async () => {
      req.body.username = 'invalidUser';
      prismaMock.user.findUnique.mockResolvedValue(null);
      await loginUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
    it('sends 403 if password is wrong', async() => {
      prismaMock.user.findUnique.mockResolvedValue({
        username: req.body.username,
        password: 'wroong',
        updatedAt: new Date(),
        uuid: '134',
        roleId: null
      });
      await loginUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
  });

  describe('logout', () => {
    beforeEach(()=> {
      req.session.userId = '321';
      req.user = {
        stuff: 'asdasd'
      };
      // req.session.destroy
    });
    it('clears the session', async () => {
      await logoutUser(req, res, next);
      expect(req.session.userId).toBeUndefined();
      expect(req.user).toBeUndefined();
      expect(req.session.destroy).toBeCalledTimes(1);
    });
    it('responds with 200', ()=>{
      logoutUser(req, res, next);
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledTimes(1);
    });
  });

  describe('validateSession', () => {
    // beforeEach(()=> {
    // })
    it('calls next for valid session', async ()=> {
      const userId = '123';
      req.session.userId = userId;
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockedUserWithoutRole,
        uuid: '123'
      });
      await validateUserSession(req, res, next);

      expect(next).toBeCalledTimes(1);
    });
    it('send 403 if user is not in db', async ()=> {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await validateUserSession(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
    it('send 403 if no userId in session', async ()=>{
      req.session.userId = undefined;
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockedUserWithoutRole,
        uuid: '123'
      });
      await validateUserSession(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
    it('if validation succeeds it set the session user object', async ()=> {
      req.session.userId = '123';
      
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockedUserWithoutRole,
        uuid: '123',
      });
      await validateUserSession(req, res, next);
      expect(req.session.user).toBeDefined();
    });
  });

  describe('createUser', () => {
    beforeEach(()=> {
      // TODO
    });
    it('allows admins to create user', async ()=>{
      const userData: UserData = {
        ...mockedUserData,
        role:  'admin',
      };
      req.session.user = userData;

      req.body = {
        username: 'slaveUser',
        password: 'hemligt',
      };
      prismaMock.user.create.mockResolvedValue(req.body);
      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(201);
      expect(res.send).toBeCalledWith(expect.objectContaining(req.body));
    });
    it('responds with 403 if unauthorized user tries to create', async ()=> {
      req.session.user = mockedUserData;
      req.body = {
        username: 'injection of doom',
        password: 'p4$$w0rD',
      };
      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);

    });
    it('responds with 403 if not logged in client tries to create', async ()=> {
      req.session.user = undefined;
      req.session.userId= undefined;
      req.body = {
        username: 'asdasd',
        password: 'asdfasdf',
      };
      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
    it('responds with 403 if trying to create a user that already exists', async () => {
      //TODO
      const userData: UserData = {
        ...mockedUserData,
        role: 'admin',
      };
      req.session.user = userData;

      req.body = {
        username: 'coolUsername',
        password: 'secret'
      };
      prismaMock.user.create.mockResolvedValueOnce(mockedUserWithRole);
      // const notUniqueError: Prisma.PrismaClientKnownRequestError = {
      //   clientVersion: 'a version. who caares...',
      //   code: 'P2002',
      //   name: 'asdfasdf',
      //   message: 'fuck you maddafakka',
      // } as Prisma.PrismaClientKnownRequestError;
      // const notUniqueError = mock<Prisma.PrismaClientKnownRequestError>();
      // notUniqueError.code = 'P2002';
      const notUniqueError = new PrismaClientKnownRequestError('not cool dude!', 'P2002', 'a cool version!');
      prismaMock.user.create.mockRejectedValueOnce(notUniqueError);

      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(201);
      expect(res.send).toBeCalledTimes(1);

      res.send.mockClear();
      res.status.mockClear();
      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(409);
      expect(res.send).toBeCalledTimes(1);

      // prismaMock.user.findUnique.mockResolvedValueOnce()

    });
  });

  describe('getUser', () => {
    it('responds with 403 if not logged in', async () => {
      req.session.user = undefined;
      await getUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
    });
    it('returns user object if is logged in', async ()=> {
      req.session.user = mockedUserData;

      // prismaMock.user.findUnique.mockResolvedValue(mockedUserWithRole);

      await getUser(req, res, next);
      // expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledTimes(1);
    });
  });

  describe('getJwt', ()=> {
    it('responds with 403 if not logged in', async () => {
      req.session.user = undefined;
      await getJwt(req, res, next);
      expect(res.status).toBeCalledWith(403);
    });
    it('returns jwt for the userObject', async () => {
      req.session.user = mockedUserData;

      await getJwt(req, res, next);
      expect(res.status).not.toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
  });

});