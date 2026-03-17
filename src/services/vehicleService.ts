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

export const createVehicle = async (
  plateNumber: string,
  companyId: string,
  token: string
) => {
  try {
    console.log('➕ [Vehicle] Create başlıyor:', plateNumber);

    const res = await axios.post(
      `${API_URL}/Vehicle`,
      {
        plateNumber,
        companyId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
      }
    );

    console.log('✅ [Vehicle] Create success, status:', res.status);
    console.log('📦 [Vehicle] Created Data:', res.data);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Vehicle] Create error');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    }
    throw error;
  }
};

export const assignDriver = async (
  vehicleId: string,
  phoneNumber: string,
  token: string
) => {
  try {
    console.log('👤 [Vehicle] Assign Driver:', vehicleId, phoneNumber);

    const res = await axios.post(
      `${API_URL}/Vehicle/${vehicleId}/assign-driver`,
      {
        phoneNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      }
    );

    console.log('✅ [Vehicle] Assign Driver success:', res.status);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Vehicle] Assign Driver error');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    }
    throw error;
  }
};

export const getVehicleDriver = async (vehicleId: string, token: string) => {
  try {
    console.log('🔍 [Vehicle] Get Drivers:', vehicleId);

    // Web servisle aynı endpoint: GET /api/vehicle/{id}/drivers (dizi döner)
    const res = await axios.get(`${API_URL}/Vehicle/${vehicleId}/drivers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*',
      },
    });

    console.log('✅ [Vehicle] Get Drivers success:', res.status);
    console.log('📦 [Vehicle] Drivers data:', res.data);

    // API bir dizi döner; ilk şoförü al
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0]; // { id, phoneNumber, displayName, firstName, lastName, ... }
    }
    return null;
  } catch (error: any) {
    console.log('❌ [Vehicle] Get Drivers ERROR');
    console.log('🔗 URL:', `${API_URL}/Vehicle/${vehicleId}/drivers`);
    console.log('🔑 Token:', token.substring(0, 10) + '...');

    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 404) {
        return null;
      }
    } else if (error.request) {
      console.log('🟠 Request (No Response):', error.request);
    } else {
      console.log('🟡 Error Message:', error.message);
    }

    throw error;
  }
};

// Web servisle aynı endpoint: DELETE /api/vehicle/{vehicleId}/remove-driver/{driverUserId}
export const removeDriver = async (vehicleId: string, driverUserId: string, token: string) => {
  try {
    console.log('🚫 [Vehicle] Remove Driver:', vehicleId, 'driverUserId:', driverUserId);

    const res = await axios.delete(
      `${API_URL}/Vehicle/${vehicleId}/remove-driver/${driverUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
      }
    );

    console.log('✅ [Vehicle] Remove Driver success:', res.status);
    return res.data;
  } catch (error: any) {
    console.log('❌ [Vehicle] Remove Driver error');
    if (error.response) {
      console.log('🔴 Status:', error.response.status);
      console.log('🔴 Data:', error.response.data);
    }
    throw error;
  }
};
