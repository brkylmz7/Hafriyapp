import { api } from './api';

export const getJobSites = async (token: string) => {
  const res = await api.get('/JobSite', {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  return res.data;
};

export const createJobSite = async (token: string, data: any) => {
  const res = await api.post('/JobSite', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
  });
  return res.data;
};

export const updateJobSite = async (token: string, id: string, data: any) => {
  const res = await api.put(`/JobSite/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
  });
  return res.data;
};

export const toggleJobSiteActive = async (
  token: string,
  id: string,
  isActive: boolean,
) => {
  const res = await api.put(
    `/JobSite/${id}/toggle-active?isActive=${isActive}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    },
  );
  return res.data;
};

export const deleteJobSite = async (token: string, id: string) => {
  const res = await api.delete(`/JobSite/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  return res.data;
};

export const getJobHauls = async (token: string, jobSiteId: string) => {
  const res = await api.get(`/Haul/jobsite/${jobSiteId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  return res.data;
};
