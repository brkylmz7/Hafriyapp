import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAULS_VISIBILITY_KEY = 'jobsite_hauls_visibility';

export const getJobSites = async (token: string) => {
  const res = await api.get('/JobSite', {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });
  return res.data;
};

export const saveHaulsVisibility = async (jobSiteId: string, value: boolean) => {
  try {
    const raw = await AsyncStorage.getItem(HAULS_VISIBILITY_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[jobSiteId] = value;
    await AsyncStorage.setItem(HAULS_VISIBILITY_KEY, JSON.stringify(map));
  } catch { }
};

export const getHaulsVisibility = async (jobSiteId: string): Promise<boolean | undefined> => {
  try {
    const raw = await AsyncStorage.getItem(HAULS_VISIBILITY_KEY);
    if (!raw) return undefined;
    const map = JSON.parse(raw);
    return jobSiteId in map ? map[jobSiteId] : undefined;
  } catch {
    return undefined;
  }
};

export const createJobSite = async (token: string, data: any) => {
  console.log('[createJobSite] payload:', JSON.stringify(data, null, 2));
  const res = await api.post('/JobSite', data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
  });
  if (res.data?.id) {
    await saveHaulsVisibility(res.data.id, data.ShowHaulsToVehicleOwners ?? true);
  }
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
  await saveHaulsVisibility(id, data.showHaulsToVehicleOwners ?? true);
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
