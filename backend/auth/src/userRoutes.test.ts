import { Router } from 'express';
import createUserRouter from './userRoutes';
// import { createMock } from 'ts-auto-mock';
// import session from 'express-session';


describe('when creating a userRouter', () => {

  // jest.mock('express-session');
  jest.mock('@quixo3/prisma-session-store');

  it('is created if provided env with session key present', () =>{
    const env: Partial<NodeJS.ProcessEnv> = {
      SESSION_KEY: 'aKeyForFakkSake',

    };
    const userRouter: Router = createUserRouter(env);
    expect(userRouter).toBeDefined();
  });
  it('throws if no session key is provided', ()=> {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn());
    const env: Partial<NodeJS.ProcessEnv> = {};
    const shouldThrow = () => createUserRouter(env);
    expect(shouldThrow).toThrow();
    warnSpy.mockRestore();
  });
});

describe('a userRouter', () => {
  it('has all the required routes', ()=>{
    const env: Partial<NodeJS.ProcessEnv> = {
      SESSION_KEY: 'bajskorv',
    };

    const requiredRoutes = [
      {path: 'create', method: 'post'},
      {path: 'login', method: 'post'},
      {path: 'me', method: 'get'},
      {path: 'jwt', method: 'get'},
    ];
    const userRouter = createUserRouter(env);
    requiredRoutes.forEach(route => {
      const match = userRouter.stack.find(s => {
        s.route.path === route.path && s.route.methods[route.method];
      });
      expect(match).toBeTruthy();
    });
    
  });
});