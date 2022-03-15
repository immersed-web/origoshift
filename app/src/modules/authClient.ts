// import axios, { AxiosInstance } from 'axios';
import { UserData } from 'app/../packages/shared-types/CustomTypes';
import { AxiosResponse } from 'axios';
import { api } from 'boot/axios';

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

export const getMe = () => handleResponse<UserData>(() => api.get('/me'));
export const getJwt = () => handleResponse<string>(() => api.get('/jwt'));
export const guestJwt = () => handleResponse<string>(() => api.get('/guest-jwt'));
export const logout = () => {
  handleResponse<void>(() => api.get('/logout'));
};
