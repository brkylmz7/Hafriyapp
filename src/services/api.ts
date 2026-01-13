import axios from 'axios';
import { getAuth } from '../utils/secureStore';

export const api = axios.create({
  baseURL: 'https://api.hafriyapp.com/api',
  headers: {
    Accept: 'text/plain',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const auth = await getAuth();
    console.log('INTERCEPTOR TOKEN', auth?.token);
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);
