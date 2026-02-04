import { api } from './api';
import axios from 'axios';

/* 🔴 Ortak hata yakalayıcı */
const handleApiError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error)) {
    console.log(`❌ API ERROR [${context}]`);
    console.log('URL:', error.config?.url);
    console.log('METHOD:', error.config?.method);
    console.log('STATUS:', error.response?.status);
    console.log('RESPONSE:', error.response?.data);
    console.log('MESSAGE:', error.message);
  } else {
    console.log(`❌ UNKNOWN ERROR [${context}]`, error);
  }

  throw error; // yukarıya fırlat
};

/* LOGIN – SMS GÖNDER */
export const login = async (phone: string) => {
  try {
    const res = await api.post('/Auth/login', {
      phoneNumber: '+9'+phone,
    });

    console.log('✅ LOGIN RESPONSE:', res.data);
    return res.data;
  } catch (error) {
    handleApiError(error, 'LOGIN');
  }
};

/* VERIFY – TOKEN AL */
export const verifySms = async (phone: string, code: string) => {
  try {
    const res = await api.post('/Auth/verify-sms', {
      phoneNumber: '+9'+ phone,
      verificationCode: code
    });

    console.log('✅ VERIFY RESPONSE:', res.data);
    return res.data;
  } catch (error) {
    handleApiError(error, 'VERIFY_SMS');
  }
};
/* REGISTER – YENİ KAYIT */
export const register = async (payload: {
  phoneNumber: string;
  userType: number; // 0 supplier, 1 driver
  firstName?: string;
  lastName?: string;
  companyName?: string;
}) => {
  try {
    const res = await api.post('/Auth/register', payload);
    console.log('REGISTER RESPONSE', res.data);
    return res.data;
  } catch (error: any) {
    console.log('REGISTER ERROR', error?.response?.data || error);
    throw error;
  }
};
