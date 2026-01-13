import { api } from './api';

export const getUserById = async (
  userId: string,
  token: string,
) => {
  try {
    const res = await api.get(`/User/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ GET USER RESPONSE', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ GET USER ERROR', error);
    throw error;
  }
};
