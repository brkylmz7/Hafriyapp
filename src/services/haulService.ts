import { api } from './api';

export type HaulApi = {
  id: string;
  vehicleId?: string;
  jobSiteId: string;
  jobSiteName: string;
  companyName?: string;
  plateNumber: string;
  serialNumber?: string;
  note?: string;
  driverName?: string;
  driverPhone?: string;
  contactPhone?: string;
  timeOfHaul: string;
  dumpLocation: string;
  tonage: number;
  cashAmount: number;
  fuelAmount: number;
  isPaid: boolean;
  isPrintedReceipt: boolean;
  paymentType: number; // 0=Nakit, 1=Yakıt, 2=İkisi
  qrCodeBase64?: string;
  createdDate: string;
};

// Tüm seferleri getir (kullanıcıya ait araçların seferleri)
export const getHauls = async (token: string): Promise<HaulApi[]> => {
  const res = await api.get('/Haul/my', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  return res.data;
};

// Araca özel seferleri getir
export const getHaulsByVehicle = async (vehicleId: string, token: string): Promise<HaulApi[]> => {
  const res = await api.get(`/Haul/vehicle/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  return res.data;
};

export type CreateHaulParams = {
  jobSiteId: string;
  plateNumber: string;
  paymentType: number; // 0=Nakit, 1=Yakıt, 2=Her ikisi
  tonage?: number;
  cashAmount?: number;
  fuelAmount?: number;
  dumpLocation?: string;
  note?: string;
  timeOfHaul?: string; // ISO, yoksa şu an
  isPrintedReceipt?: boolean;
};

// Yeni sefer oluştur
export const createHaul = async (params: CreateHaulParams, token: string): Promise<HaulApi> => {
  const res = await api.post(
    '/Haul',
    {
      jobSiteId: params.jobSiteId,
      plateNumber: params.plateNumber.replace(/\s/g, '').toUpperCase(),
      paymentType: params.paymentType,
      tonage: params.tonage ?? 0,
      cashAmount: params.cashAmount ?? 0,
      fuelAmount: params.fuelAmount ?? 0,
      dumpLocation: params.dumpLocation ?? '',
      note: params.note ?? '',
      timeOfHaul: params.timeOfHaul ?? new Date().toISOString(),
      isPaid: false,
      isPrintedReceipt: params.isPrintedReceipt ?? false,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );
  return res.data;
};

export type UpdateHaulPaymentParams = {
  haulId: string;
  isPaid: boolean;
  paymentType?: number;
  cashAmount?: number;
  fuelAmount?: number;
  tonage?: number;
  dumpLocation?: string;
};

// Sefer ödeme durumunu güncelle
export const updateHaulPayment = async (
  params: UpdateHaulPaymentParams,
  token: string,
): Promise<void> => {
  await api.patch(
    `/Haul/${params.haulId}/payment`,
    {
      isPaid: params.isPaid,
      paymentType: params.paymentType,
      cashAmount: params.cashAmount,
      fuelAmount: params.fuelAmount,
      tonage: params.tonage,
      dumpLocation: params.dumpLocation,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  );
};
