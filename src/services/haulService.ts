import axios from 'axios';

const API_URL = 'https://api.hafriyapp.com/api';

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
  try {
    console.log('🚀 [Haul] getHauls başlıyor');
    const res = await axios.get(`${API_URL}/Haul/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    console.log('✅ [Haul] Status:', res.status, '| Adet:', res.data?.length);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Haul] getHauls HATA');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    } else {
      console.log('🟡 Message:', error.message);
    }
    throw error;
  }
};

// Araca özel seferleri getir
export const getHaulsByVehicle = async (vehicleId: string, token: string): Promise<HaulApi[]> => {
  try {
    console.log('🚀 [Haul] getHaulsByVehicle:', vehicleId);
    const res = await axios.get(`${API_URL}/Haul/vehicle/${vehicleId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    console.log('✅ [Haul] Vehicle hauls:', res.data?.length);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Haul] getHaulsByVehicle HATA');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    }
    throw error;
  }
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
  try {
    console.log('🚀 [Haul] createHaul başlıyor:', params.plateNumber);
    const res = await axios.post(
      `${API_URL}/Haul`,
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
      }
    );
    console.log('✅ [Haul] createHaul success:', res.status);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Haul] createHaul HATA');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    } else {
      console.log('🟡 Network error:', error.message);
    }
    throw error;
  }
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
  token: string
): Promise<void> => {
  try {
    console.log('💰 [Haul] updateHaulPayment:', params.haulId, 'isPaid:', params.isPaid);
    await axios.patch(
      `${API_URL}/Haul/${params.haulId}/payment`,
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
      }
    );
    console.log('✅ [Haul] Payment updated');
  } catch (error: any) {
    console.log('❌ [Haul] updateHaulPayment HATA');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    }
    throw error;
  }
};
