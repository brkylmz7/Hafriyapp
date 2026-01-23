import axios from 'axios';

export const createJobSite = async (token: string, payload: any) => {
  const res = await axios.post(
    'https://api.hafriyapp.com/api/JobSite',
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return res.data;
};
