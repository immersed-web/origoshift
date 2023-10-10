import axios, { type AxiosResponse } from 'axios';

import type {JwtPayload, JwtUserData } from 'schemas';
import decodeJwt from 'jwt-decode';

const completeAuthUrl = `${import.meta.env.EXPOSED_AUTH_URL}${import.meta.env.EXPOSED_AUTH_PORT}${import.meta.env.EXPOSED_AUTH_PATH}`;
console.log('authUrl: ', completeAuthUrl);
const authEndpoint = axios.create({ baseURL: completeAuthUrl, withCredentials: true });

const handleResponse = async <ReturnType>(apiCall: () => Promise<AxiosResponse<ReturnType>>) => {
  try {
    const response = await apiCall();
    // console.log('user/auth Api response received:', response);
    return response.data;
  } catch (e: any) {
    return Promise.reject(Error(e.response.data));
  }
};

export const login = async (username: string, password: string) => {
  try {
    await authEndpoint.post('/user/login', {
      username,
      password,
    });
    // return response.data;
    return Promise.resolve();
  } catch (e: any) {
    return Promise.reject(Error(e.response.data));
  }
};


if(import.meta.hot){
  import.meta.hot.on('vite:beforeUpdate', () => clearTimeout(activeTimeout));
}
let activeTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

export const getToken = () => {
  // console.log('token getter called');
  return latestJwtToken;
};
let latestJwtToken: string | undefined;
// let prepopulatedLogin: () => Promise<void>;


let nrOfRetries = 0;
const autoFetchJwt = async (assignFn: (receivedToken: string) => void, fetchFn: () => Promise<string>, failRecoveryFn?: () => Promise<string>) => {
  if(activeTimeout){
    // console.log('cleared old jwt autofetch timeout');
    clearTimeout(activeTimeout);
    activeTimeout = undefined;
  }
  try{
    let receivedToken;
    if(nrOfRetries > 3 && failRecoveryFn){
      receivedToken = await failRecoveryFn();
    } else {
      receivedToken = await fetchFn();
    }
    const decodedToken = decodeJwt<JwtPayload>(receivedToken);
    if(!decodedToken.exp) {
      throw Error('no exp key found in token');
    }
    assignFn(receivedToken);
    nrOfRetries = 0;
    const expUnixStamp = new Date(decodedToken.exp * 1000);
    const expInMillis = expUnixStamp.valueOf() - Date.now();
    console.log('jwtToken expires in (millis):', expInMillis);
    // console.log('UTC now is:', new Date().toUTCString());
    const refetchIn = expInMillis > 2000 ? expInMillis - 1000 : expInMillis * 0.8;
    activeTimeout = setTimeout(() => {
      autoFetchJwt(assignFn, fetchFn, failRecoveryFn);
    }, refetchIn);
  } catch (e) {
    console.error(e);
    const retryIn = 5;
    nrOfRetries++;
    console.log('nrOfRetries:', nrOfRetries);
    console.error(`Something seems wrong with jwt fetching. Retrying in ${retryIn} seconds`);
    activeTimeout = setTimeout(() => {
      autoFetchJwt(assignFn, fetchFn, failRecoveryFn);
    }, retryIn * 1000);
  }
};

export const guestAutoToken =  async (assignFn?: (receivedToken: string) => void) => {
  latestJwtToken = undefined;
  const combinedAssigner = (t: string) => {
    if(assignFn){
      assignFn(t);
    }
    latestJwtToken = t;
  };
  return await autoFetchJwt(
    combinedAssigner,
    async () => await guestJwt({previousToken: latestJwtToken}),
    async () => await guestJwt(),
  );

  // return latestJwtToken;
};

export const userAutoToken = async (assignFn?: (receivedToken: string) => void) => {

  const combinedAssigner = (t: string) => {
    if(assignFn){
      assignFn(t);
    }
    latestJwtToken = t;
  };
  return await autoFetchJwt(combinedAssigner, getJwt);
};

/**
 * Tries to login with the provided user credentials. Also initiates an ongoing autofetching of tokens when the current one is about to expire.
 * After calling this function, you should be able to get the latest valid token by simply calling getToken()
 * @returns an access token. Use it within the expiration period! If you can't use the token direclty, you can get an updated recent token by calling getToken()
 */
export const loginWithAutoToken = async (username: string, password: string) => {

  // prepopulatedLogin = () => login(username, password);
  await login(username, password);

  await userAutoToken(t => latestJwtToken = t);
  return latestJwtToken;
};

// export const deleteUser = (uuid: string) => authEndpoint.post('delete-user', { uuid });
// export const createUser = (payload: { username: string, password: string, gathering?: string, role: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('create', payload));
// export const updateUser = (payload: { uuid: string, username?: string, password?: string, gathering?: string, role?: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('update', payload));
// export const getUsers = (payload: Record<string, unknown>) => handleResponse<Omit<UserWithIncludes, 'password'>[]>(() => authEndpoint.post('get-users', payload));

export const guestJwt = (params?: {requestedUsername?: string, previousToken?: string}) => {
  if(params?.previousToken){
    return handleResponse<string>(() =>authEndpoint.get(`/guest-jwt?prevToken=${params.previousToken}`));
  }
  if(params?.requestedUsername){
    return handleResponse<string>(() =>authEndpoint.get(`/guest-jwt?username=${params.requestedUsername}`));
  }
  return handleResponse<string>(() =>authEndpoint.get('/guest-jwt'));
};
export const getJwt = () => handleResponse<string>(() => authEndpoint.get('user/jwt'));
export const getMe = () => handleResponse<JwtUserData>(() => authEndpoint.get('/user/me'));
export const logout = () => {
  clearTimeout(activeTimeout);
  return handleResponse<void>(() => authEndpoint.get('user/logout'));
};
