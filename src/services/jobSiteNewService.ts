// services/jobSiteService.ts
import axios from 'axios';

const API_URL = 'https://api.hafriyapp.com/api';

export const getJobSites = async (token: string) => {
  const res = await axios.get(`${API_URL}/JobSite`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });

  return res.data;
};
