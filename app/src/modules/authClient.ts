import axios, { type AxiosResponse } from 'axios';
// import { NonGuestUserRole, UserData } from 'shared-types/CustomTypes';
// import { AxiosResponse } from 'axios';
// import { extractMessageFromCatch } from "shared-modules/utilFns";

// import type { Gathering, GatheringWithRoomsAndUsers, UserWithIncludes } from 'database';
import type { JwtUserData } from 'schemas';

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

// export const deleteUser = (uuid: string) => authEndpoint.post('delete-user', { uuid });
// export const createUser = (payload: { username: string, password: string, gathering?: string, role: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('create', payload));
// export const updateUser = (payload: { uuid: string, username?: string, password?: string, gathering?: string, role?: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => authEndpoint.post('update', payload));
// export const getUsers = (payload: Record<string, unknown>) => handleResponse<Omit<UserWithIncludes, 'password'>[]>(() => authEndpoint.post('get-users', payload));

export const guestJwt = () => handleResponse<string>(() => authEndpoint.get('/guest-jwt'));
export const getMe = () => handleResponse<JwtUserData>(() => authEndpoint.get('/user/me'));
export const getJwt = () => handleResponse<string>(() => authEndpoint.get('user/jwt'));
export const logout = () => {
  handleResponse<void>(() => authEndpoint.get('user/logout'));
};
