// import axios, { AxiosInstance } from 'axios';
import { UserData } from 'app/../packages/shared-types/CustomTypes';
import { AxiosResponse } from 'axios';
import { api } from 'boot/axios';

import { Prisma } from '@prisma/client';

// TODO: Move prisma functions and types to shared modules/types so we can use same types on consuming and producing sides
const gatheringWithRoomsAndUsers = Prisma.validator<Prisma.GatheringArgs>()({
  include: { rooms: true, users: true },
});
type GatheringWithRoomsAndUsers = Prisma.GatheringGetPayload<typeof gatheringWithRoomsAndUsers>;

const handleResponse = async <ReturnType>(apiCall: () => Promise<AxiosResponse<ReturnType>>) => {
  const response = await apiCall();
  console.log('auth response received:', response);
  return response.data;
};

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post('/login', {
      username,
      password,
    });
    return response.data;
  } catch (e) {
    Promise.reject(e);
  }
};

export const getUsers = (payload: Record<string, unknown>) => handleResponse<Record<string, number>[]>(() => api.post('get-users', payload));
export const getGathering = (payload: Record<string, unknown>) => handleResponse<GatheringWithRoomsAndUsers>(() => api.post('gathering', payload));
export const getAllGatherings = () => handleResponse<GatheringWithRoomsAndUsers[]>(() => api.get('allgatherings'));

export const getMe = () => handleResponse<UserData>(() => api.get('/me'));
export const getJwt = () => handleResponse<string>(() => api.get('/jwt'));
export const guestJwt = () => handleResponse<string>(() => api.get('/guest-jwt'));
export const logout = () => {
  handleResponse<void>(() => api.get('/logout'));
};
