import {createJwt, verifyJwtToken, jwtMiddleware } from './jwtUtils';
import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';
import { mock, mockDeep, mockFn } from 'jest-mock-extended';

it('can create a jwt token', () => {
  const userObj = {
    firstName: 'nikolai',
    lastName: 'tesla',
  };
  const token = createJwt(userObj);

  // console.log(token);
  const decoded = jwt.decode(token);
  // console.log(decoded);
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
      verifyJwtToken(token);
    };
    expect(throwingFunction).toThrow();
    expect(mockedNowFn).toHaveBeenCalled();
    // setTimeout(() => {
    //   done();
    // }, 1000);
    jest.restoreAllMocks();
  });
  it('verify fails if key is wrong', ()=>{
    const expiresIn = 20;
    const invalidToken = createJwt(userObject, expiresIn, 'myJwt', 'wrongKey');
    const throwingFunction = () => {
      verifyJwtToken(invalidToken, 'anotherKey');
    };
    expect(throwingFunction).toThrow();
  });
});

describe('the jwtVerifyMiddleware', () => {

  // let req: Partial<Request>;
  const req = mockDeep<Request>();
  const headers: Record<string, string | undefined> = {
    // authorization: undefined
  };
  req.headers = headers;
  // let resp: Partial<Response>;
  const res = mock<Response>();
  // const next: NextFunction = jest.fn();
  const next = mockFn<NextFunction>();
  const userData = {
    firstName: 'Nikolai',
    lastName: 'Tesla',
  };

  beforeEach(()=>{
    next.mockReset();
    // req.header.mockReset();
    req.header.mockImplementation((name) => {
      // console.log('header function called!', name);
      // console.log('gonna return: ', headers[name]);
      return headers[name];
    });
    res.status.mockReset();
    res.status.mockReturnValue(res);
    res.send.mockReset();
  });

  it('calls nextFunction if jwt is successfully verified', () => {
    const token = createJwt(userData);
    req.headers.authorization = `Bearer ${token}`;
    jwtMiddleware(req, res, next);
    expect(next).toBeCalledTimes(1);
  });

  it('fails with 403 response if wrong key', ()=> {
    // const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiaGVsbG8ifQ.opmZepWnsvYTa2QbXAskDhZs6KKcuMuIDHdK9F59wy8';
    const invalidToken = createJwt(userData, 20, 'myJwt', 'invalidKey');
    req.headers.authorization =`Bearer ${invalidToken}` ;

    expect(() => jwtMiddleware(req, res, next)).not.toThrow();
    expect(next).not.toBeCalled();
    expect(res.status).toBeCalledWith(403);
    expect(res.send).toBeCalled();
  });
  it('fails with 403 response if authorization header is missing', ()=> {
    jwtMiddleware(req, res, next);
    expect(res.status).toBeCalledWith(403);
    expect(res.send).toBeCalled();
  });
});