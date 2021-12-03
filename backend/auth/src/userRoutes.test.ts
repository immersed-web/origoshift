import { NextFunction, Request, Response, Router } from 'express';
import createUserRouter, {createUser, loginUser, getUser, getJwt, logoutUser, validateUserSession} from './userRoutes';
import { mock, mockDeep, mockFn } from 'jest-mock-extended';

import brcypt from 'bcrypt';

// import prisma from './prismaClient';
import { prismaMock, PrismaSessionStoreMock } from './testUtils/prismaMock';
import { Prisma } from '@prisma/client';

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
  const userWithRole = Prisma.validator<Prisma.UserArgs>()({include: {role: true}});
  type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>
  const mockedUser = {
    username: 'mrOizo',
    password: 'passw0rd',
    uuid: '123',
    roleId: null,
    updatedAt: new Date(),
  };
  
  const req = mockDeep<Request>();
  const res = mock<Response>();
  res.status.mockReturnValue(res);
  const next = mockFn<NextFunction>();
  beforeEach(() => {
    res.status.mockClear();
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
      prismaMock.user.findUnique.mockResolvedValue({username: req.body.username, password: hashedPassword, updatedAt: new Date(), uuid: '123', roleId: null});
      await loginUser(req, res, next);
      expect(req.session.userId).toBeDefined();
      expect(req.user).toBeDefined();
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledTimes(1);
    });
    
    it('sends 403 if username is wrong', async () => {

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockedUser,
        password: req.body.password,
      });
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
        ...mockedUser,
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
        ...mockedUser,
        uuid: '123'
      });
      await validateUserSession(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);
    });
    it('if validation succeeds it set the user object', async ()=> {
      req.session.userId = '123';
      
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockedUser,
        uuid: '123',
      });
      await validateUserSession(req, res, next);
      expect(req.user).toBeDefined();
    });
  });
  describe('createUser', () => {
    beforeEach(()=> {
      // TODO
    });
    it('allows admins to create user', async ()=>{
      const prismaUser: UserWithRole = {
        ...mockedUser,
        role: {
          id: 123,
          role: 'admin',
        }
      };

      req.user = prismaUser;
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
      req.user = mockedUser;
      req.body = {
        username: 'slaveUser',
        password: 'p4$$w0rD',
      };
      await createUser(req, res, next);
      expect(res.status).toBeCalledWith(403);
      expect(res.send).toBeCalledTimes(1);

    });
    it('responds with 403 if request comes from not logged in user', () => {
      // TODO
    });
    it('responds with 403 if trying to create a user that already exists', () => {
      //TODO
    });
  });
});