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

export const createJobSite = async (token: string, data: any) => {
  console.log('📦 CREATE JOB DATA SENT:', JSON.stringify(data, null, 2));
  const res = await axios.post(`${API_URL}/JobSite`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
  });
  return res.data;
};

export const updateJobSite = async (token: string, id: string, data: any) => {
  console.log('📦 UPDATE JOB DATA SENT:', JSON.stringify(data, null, 2));
  const res = await axios.put(`${API_URL}/JobSite/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
  });
  return res.data;
};

export const deleteJobSite = async (token: string, id: string) => {
  console.log('🗑 DELETE JOB:', id);
  const res = await axios.delete(`${API_URL}/JobSite/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  return res.data;
};
