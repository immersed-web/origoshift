// import axios, { AxiosInstance } from 'axios';
import { AxiosResponse } from 'axios';
import { api } from 'boot/axios';

const handleResponse = async <ReturnType>(apiCall: () => Promise<AxiosResponse<ReturnType>>) => {
  const response = await apiCall();
  console.log('response received:', response);
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

export const getMe = () => handleResponse(() => api.get('/me'));
export const getJwt = () => handleResponse<string>(() => api.get('/jwt'));
