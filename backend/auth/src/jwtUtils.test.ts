import {createJwt, verifyJwtToken, jwtMiddleware } from './jwtUtils';
import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';


it('can create a jwt token', () => {
  const userObj = {
    firstName: 'nikolai',
    lastName: 'tesla',
  };
  const token = createJwt(userObj);

  console.log(token);
  const decoded = jwt.decode(token);
  console.log(decoded);
  expect(decoded).toMatchObject(userObj);
});

describe('when creating a token', () => {
  const userObject = {
    firstName: 'Nikolai',
    lastName: 'Tesla'
  };
  it('verify throws after expired', () => {
    const expiresIn = 20;
    const token = createJwt(userObject, 1);
    const decoded = verifyJwtToken(token);
    expect(decoded).toMatchObject(userObject);
    const futureNow = new Date();
    futureNow.setSeconds(futureNow.getSeconds() + expiresIn + 1);
    const mockedNowFn = jest.spyOn(global.Date, 'now').mockReturnValue(futureNow.valueOf());
    // jest.spyOn(global, 'Date').mockImplementation(() => futureNow as unknown as string);
    const throwingFunction = () =>{
      const decoded = verifyJwtToken(token);
    };
    expect(throwingFunction).toThrow();
    expect(mockedNowFn).toHaveBeenCalled();
    // setTimeout(() => {
    //   done();
    // }, 1000);
    jest.restoreAllMocks();
  });
});

describe('the jwtVerifyMiddleware', () => {

  let req: Partial<Request>;
  let resp: Partial<Response>;
  const next: NextFunction = jest.fn();
  it('calls nextFunction if jwt is successfully verified', () => {
    const userData = {
      firstName: 'Nikolai',
      lastName: 'Tesla',
    };
    const token = createJwt(userData);
    const authHeader = `Bearer ${token}`;
    const headerFn = jest.fn();
    headerFn.mockImplementation((headerName) => {
      if(headerName === 'authorization')
        return authHeader;
    });
    
    req = {
      headers: {
        authorization: authHeader
      },
      header: headerFn,
    };
    resp = {
      send: jest.fn(),
    };
    jwtMiddleware(req as Request, resp as Response, next);
  });
});