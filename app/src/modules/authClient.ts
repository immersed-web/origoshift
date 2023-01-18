// import axios, { AxiosInstance } from 'axios';
import { NonGuestUserRole, UserData } from 'shared-types/CustomTypes';
import { AxiosResponse } from 'axios';
import { api } from 'boot/axios';
import { extractMessageFromCatch } from "shared-modules/utilFns";

import type { Gathering, GatheringWithRoomsAndUsers, UserWithIncludes } from 'database';

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
    const response = await api.post('/login', {
      username,
      password,
    });
    return response.data;
  } catch (e: any) {
    return Promise.reject(e.response);
  }
};

export const deleteUser = (uuid: string) => api.post('delete-user', { uuid });
export const createUser = (payload: { username: string, password: string, gathering?: string, role: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => api.post('create', payload));
export const updateUser = (payload: { uuid: string, username?: string, password?: string, gathering?: string, role?: NonGuestUserRole }) => handleResponse<Omit<UserWithIncludes, 'password'>>(() => api.post('update', payload));
export const getUsers = (payload: Record<string, unknown>) => handleResponse<Omit<UserWithIncludes, 'password'>[]>(() => api.post('get-users', payload));
export const getGathering = (payload: { gatheringName?: string }) => handleResponse<GatheringWithRoomsAndUsers>(() => api.post('gathering', payload));
export const getAllGatherings = () => handleResponse<GatheringWithRoomsAndUsers[]>(() => api.get('allgatherings'));
export const deleteGathering = (payload: { gatheringName: string }) => handleResponse<Gathering>(() => api.post('delete-gathering', payload));
export const createGathering = (payload: { gatheringName: string }) => handleResponse<GatheringWithRoomsAndUsers>(() => api.post('create-gathering', payload));

export const getMe = () => handleResponse<UserData>(() => api.get('/me'));
export const getJwt = () => handleResponse<string>(() => api.get('/jwt'));
export const guestJwt = () => handleResponse<string>(() => api.get('/guest-jwt'));
export const logout = () => {
  handleResponse<void>(() => api.get('/logout'));
};
