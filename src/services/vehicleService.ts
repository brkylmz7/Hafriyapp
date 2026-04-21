import { api } from './api';

export const getVehicles = async (token: string) => {
  const res = await api.get('/Vehicle', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/plain' },
  });
  return res.data;
};

export const deleteVehicle = async (vehicleId: string, token: string) => {
  const res = await api.delete(`/Vehicle/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
  });
  return res.data;
};

export const updateVehicle = async (
  vehicleId: string,
  plateNumber: string,
  companyId: string,
  token: string,
) => {
  const res = await api.put(
    `/Vehicle/${vehicleId}`,
    { plateNumber, companyId },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: '*/*' } },
  );
  return res.data;
};

export const createVehicle = async (
  plateNumber: string,
  companyId: string,
  driverPhoneNumber: string,
  token: string,
) => {
  const res = await api.post(
    '/Vehicle',
    { plateNumber, companyId, driverPhoneNumber },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'text/plain' } },
  );
  return res.data;
};

export const assignDriver = async (
  vehicleId: string,
  phoneNumber: string,
  token: string,
) => {
  const res = await api.post(
    `/Vehicle/${vehicleId}/assign-driver`,
    { phoneNumber },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: '*/*' } },
  );
  return res.data;
};

export const getVehicleDriver = async (vehicleId: string, token: string) => {
  const res = await api.get(`/Vehicle/${vehicleId}/drivers`, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
  });
  if (Array.isArray(res.data) && res.data.length > 0) {
    return res.data[0];
  }
  return null;
};

export const removeDriver = async (vehicleId: string, driverUserId: string, token: string) => {
  const res = await api.delete(`/Vehicle/${vehicleId}/remove-driver/${driverUserId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
  });
  return res.data;
};

// Şoför kendi aracını ekler (plaka sistemde yoksa oluşturur ve atar)
export const driverAddVehicle = async (plateNumber: string) => {
  const res = await api.post('/Vehicle/driver-add', { plateNumber });
  return res.data;
};

// Şoför araçtan ayrılır
export const driverLeaveVehicle = async (vehicleId: string) => {
  const res = await api.delete(`/Vehicle/driver-leave/${vehicleId}`);
  return res.data;
};
