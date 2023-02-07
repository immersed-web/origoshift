import axios, { type AxiosResponse } from 'axios';
// import { NonGuestUserRole, UserData } from 'shared-types/CustomTypes';
// import { AxiosResponse } from 'axios';
// import { extractMessageFromCatch } from "shared-modules/utilFns";

// import type { Gathering, GatheringWithRoomsAndUsers, UserWithIncludes } from 'database';
import type {JwtPayload, JwtUserData } from 'schemas';
import decodeJwt from 'jwt-decode';

const completeAuthUrl = `${import.meta.env.VITE_AUTH_URL}${import.meta.env.VITE_AUTH_PORT}${import.meta.env.VITE_AUTH_PATH}`;
console.log('authUrl: ', completeAuthUrl);
const authEndpoint = axios.create({ baseURL: completeAuthUrl, withCredentials: true });

const handleResponse = async <ReturnType>(apiCall: () => Promise<AxiosResponse<ReturnType>>) => {
  try {
    const response = await apiCall();
    console.log('user/auth Api response received:', response);
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
    return Promise.reject(e.response);
  }
};


let activeTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

export let latestJwtToken: string;
export const loginWithAutoToken = async (username: string, password: string) => {
  await login(username, password);

  autoFetchJwt((token) => {latestJwtToken = token;}, getJwt);
};

// TODO: As of now all works fine AS LONG AS clients autofetches and gets a new token before the current is expired.
// BUT. If autofetch is running and for some reason the old token is expired, the autofetch will just keep trying and fail. Very sad!
const autoFetchJwt = async (assignFn: (receivedToken: string) => void, fetchFn: typeof getJwt) => {
  if(activeTimeout){
    // console.log('cleared old jwt autofetch timeout');
    clearTimeout(activeTimeout);
    activeTimeout = undefined;
  }
  try{
    const receivedToken = await fetchFn();
    assignFn(receivedToken);
    const decodedToken = decodeJwt<JwtPayload>(receivedToken);
    if(!decodedToken.exp) {
      throw Error('no exp key found in token');
    }
    const expUnixStamp = new Date(decodedToken.exp * 1000);
    const expInMillis = expUnixStamp.valueOf() - Date.now();
    console.log('jwtToken expires in (millis):', expInMillis);
    activeTimeout = setTimeout(() => {
      autoFetchJwt(assignFn, fetchFn);
    }, expInMillis-100);
  } catch (e) {
    console.error(e);
    const retryIn = 5;
    console.error(`Something seems wrong with jwt fetching. Retrying in ${retryIn} seconds`);
    activeTimeout = setTimeout(() => autoFetchJwt(assignFn, fetchFn), retryIn * 1000);
  }
};

export let latestGuestJwtToken: string | undefined = undefined;
export const autoGuestToken =  async () => {
  await autoFetchJwt((token) => {latestGuestJwtToken = token;}, async () => {return await guestJwt(latestGuestJwtToken);});
};

// export const deleteUser = (uuid: string) => authEndpoint.post('delete-user', { uuid });
// export const createUser = (payload: { username: string, password: string, gathering?: string, role: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('create', payload));
// export const updateUser = (payload: { uuid: string, username?: string, password?: string, gathering?: string, role?: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('update', payload));
// export const getUsers = (payload: Record<string, unknown>) => handleResponse<Omit<UserWithIncludes, 'password'>[]>(() => authEndpoint.post('get-users', payload));

export const guestJwt = (oldToken?: string) => handleResponse<string>(() => oldToken?authEndpoint.get(`/guest-jwt?${oldToken}`):authEndpoint.get('/guest-jwt'));
export const getJwt = () => handleResponse<string>(() => authEndpoint.get('user/jwt'));
export const getMe = () => handleResponse<JwtUserData>(() => authEndpoint.get('/user/me'));
export const logout = () => {
  handleResponse<void>(() => authEndpoint.get('user/logout'));
};
