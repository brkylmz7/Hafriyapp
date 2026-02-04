import axios from 'axios';

const API_URL = 'https://api.hafriyapp.com/api';

export const getVehicles = async (token: string) => {
  try {
    console.log('🚀 [Vehicle] Request başlıyor');

    const res = await axios.get(`${API_URL}/Vehicle`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/plain',
      },
    });

    console.log('✅ [Vehicle] Status:', res.status);
    console.log('📦 [Vehicle] Raw Response:', res.data);

    return res.data;
  } catch (error: any) {
    console.log('❌ [Vehicle] HATA OLUŞTU');

    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
      console.log('🔴 Headers:', error.response.headers);
    } else if (error.request) {
      console.log('🟠 Request yapıldı ama response yok:', error.request);
    } else {
      console.log('🟡 Axios error message:', error.message);
    }

    throw error; // üst katmana da düşsün
  }
};
export const deleteVehicle = async (vehicleId: string, token: string) => {
    try {
      console.log('🗑 [Vehicle] Delete başlıyor:', vehicleId);
  
      const res = await axios.delete(`${API_URL}/Vehicle/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
      });
  
      console.log('✅ [Vehicle] Delete success, status:', res.status);
      return res.data;
    } catch (error: any) {
      console.log('❌ [Vehicle] Delete error');
  
      if (error.response) {
        console.log('🔴 Status:', error.response.status);
        console.log('🔴 Data:', error.response.data);
      } else if (error.request) {
        console.log('🟠 Request var ama response yok:', error.request);
      } else {
        console.log('🟡 Message:', error.message);
      }
  
      throw error;
    }
  };

  export const updateVehicle = async (
    vehicleId: string,
    plateNumber: string,
    companyId: string,
    token: string
  ) => {
    try {
      console.log('✏️ [Vehicle] Update başlıyor');
  
      const res = await axios.put(
        `${API_URL}/Vehicle/${vehicleId}`,
        {
          plateNumber,
          companyId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
        }
      );
  
      console.log('✅ [Vehicle] Update success:', res.status);
      return res.data;
    } catch (error: any) {
      console.log('❌ [Vehicle] Update error');
  
      if (error.response) {
        console.log('🔴 Status:', error.response.status);
        console.log('🔴 Data:', error.response.data);
      } else {
        console.log('🟡 Message:', error.message);
      }
  
      throw error;
    }
  };
  
