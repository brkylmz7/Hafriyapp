import axios from 'axios';

const API_URL = 'https://api.hafriyapp.com/api';

export const getMarketJobs = async (
  token: string,
  provinceCode: number,
) => {
  const url = `${API_URL}/JobSite/market`;

  const options = {
    params: {
      provinceCode,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  };

  // 🔵 REQUEST LOG
  console.log('🟦 [MarketJobs] REQUEST');
  console.log('URL:', url);
  console.log('OPTIONS:', options);

  try {
    const response = await axios.get(url, options);

    // 🟢 RESPONSE LOG
    console.log('🟩 [MarketJobs] RESPONSE STATUS:', response.status);
    console.log('🟩 [MarketJobs] RESPONSE DATA:', response.data);

    return response.data;
  } catch (error: any) {
    // 🔴 ERROR LOG
    console.log('🟥 [MarketJobs] ERROR');

    if (error.response) {
      // Server response hatası (4xx / 5xx)
      console.log('STATUS:', error.response.status);
      console.log('DATA:', error.response.data);
      console.log('HEADERS:', error.response.headers);
    } else if (error.request) {
      // Request atıldı ama response yok
      console.log('NO RESPONSE RECEIVED');
      console.log('REQUEST:', error.request);
    } else {
      // Axios config / JS error
      console.log('MESSAGE:', error.message);
    }

    console.log('CONFIG:', error.config);

    throw error;
  }
};
