import { api } from './api';

export const getMarketJobs = async (
  token: string,
  provinceCode?: number,
  districtName?: string,
) => {
  const params: Record<string, any> = {};
  if (provinceCode != null) params.provinceCode = provinceCode;
  if (districtName) params.districtName = districtName;

  const response = await api.get('/JobSite/market', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};
