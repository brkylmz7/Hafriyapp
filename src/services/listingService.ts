import { api } from './api';

export const LISTING_TYPES = [
  { type: 0, label: 'Araç Kiralama', icon: '🚛', color: '#1976D2', bg: '#E3F2FD' },
  { type: 1, label: 'Tır Pazarı',    icon: '🏪', color: '#2E7D32', bg: '#E8F5E9' },
  { type: 2, label: 'Şoför İlanı',   icon: '👤', color: '#E65100', bg: '#FFF3E0' },
] as const;

export const PROVINCES: { code: number; name: string }[] = [
  { code: 1, name: 'Adana' }, { code: 2, name: 'Adıyaman' }, { code: 3, name: 'Afyonkarahisar' },
  { code: 4, name: 'Ağrı' }, { code: 5, name: 'Amasya' }, { code: 6, name: 'Ankara' },
  { code: 7, name: 'Antalya' }, { code: 8, name: 'Artvin' }, { code: 9, name: 'Aydın' },
  { code: 10, name: 'Balıkesir' }, { code: 11, name: 'Bilecik' }, { code: 12, name: 'Bingöl' },
  { code: 13, name: 'Bitlis' }, { code: 14, name: 'Bolu' }, { code: 15, name: 'Burdur' },
  { code: 16, name: 'Bursa' }, { code: 17, name: 'Çanakkale' }, { code: 18, name: 'Çankırı' },
  { code: 19, name: 'Çorum' }, { code: 20, name: 'Denizli' }, { code: 21, name: 'Diyarbakır' },
  { code: 22, name: 'Edirne' }, { code: 23, name: 'Elazığ' }, { code: 24, name: 'Erzincan' },
  { code: 25, name: 'Erzurum' }, { code: 26, name: 'Eskişehir' }, { code: 27, name: 'Gaziantep' },
  { code: 28, name: 'Giresun' }, { code: 29, name: 'Gümüşhane' }, { code: 30, name: 'Hakkâri' },
  { code: 31, name: 'Hatay' }, { code: 32, name: 'Isparta' }, { code: 33, name: 'Mersin' },
  { code: 34, name: 'İstanbul' }, { code: 35, name: 'İzmir' }, { code: 36, name: 'Kars' },
  { code: 37, name: 'Kastamonu' }, { code: 38, name: 'Kayseri' }, { code: 39, name: 'Kırklareli' },
  { code: 40, name: 'Kırşehir' }, { code: 41, name: 'Kocaeli' }, { code: 42, name: 'Konya' },
  { code: 43, name: 'Kütahya' }, { code: 44, name: 'Malatya' }, { code: 45, name: 'Manisa' },
  { code: 46, name: 'Kahramanmaraş' }, { code: 47, name: 'Mardin' }, { code: 48, name: 'Muğla' },
  { code: 49, name: 'Muş' }, { code: 50, name: 'Nevşehir' }, { code: 51, name: 'Niğde' },
  { code: 52, name: 'Ordu' }, { code: 53, name: 'Rize' }, { code: 54, name: 'Sakarya' },
  { code: 55, name: 'Samsun' }, { code: 56, name: 'Siirt' }, { code: 57, name: 'Sinop' },
  { code: 58, name: 'Sivas' }, { code: 59, name: 'Tekirdağ' }, { code: 60, name: 'Tokat' },
  { code: 61, name: 'Trabzon' }, { code: 62, name: 'Tunceli' }, { code: 63, name: 'Şanlıurfa' },
  { code: 64, name: 'Uşak' }, { code: 65, name: 'Van' }, { code: 66, name: 'Yozgat' },
  { code: 67, name: 'Zonguldak' }, { code: 68, name: 'Aksaray' }, { code: 69, name: 'Bayburt' },
  { code: 70, name: 'Karaman' }, { code: 71, name: 'Kırıkkale' }, { code: 72, name: 'Batman' },
  { code: 73, name: 'Şırnak' }, { code: 74, name: 'Bartın' }, { code: 75, name: 'Ardahan' },
  { code: 76, name: 'Iğdır' }, { code: 77, name: 'Yalova' }, { code: 78, name: 'Karabük' },
  { code: 79, name: 'Kilis' }, { code: 80, name: 'Osmaniye' }, { code: 81, name: 'Düzce' },
];

export const getProvinceName = (code: number): string =>
  PROVINCES.find(p => p.code === code)?.name ?? '';

export type ListingImage = {
  id: string;
  imagePath: string;
  sortOrder: number;
};

export type Listing = {
  id: string;
  listingType: number;
  title: string;
  description?: string;
  contactPhone: string;
  provinceCode: number;
  districtName?: string;
  price?: number;
  isActive: boolean;
  createdDate: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  thumbnailUrl?: string;
  images?: ListingImage[];
};

export type ListingPagedResult = {
  items: Listing[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateListingParams = {
  listingType: number;
  title: string;
  description?: string;
  contactPhone: string;
  provinceCode: number;
  districtName?: string;
  price?: number;
  images?: string[];
};

export type UpdateListingParams = {
  title?: string;
  description?: string;
  contactPhone?: string;
  provinceCode?: number;
  districtName?: string;
  price?: number;
  isActive?: boolean;
  images?: string[];
};

// GET /api/Listing — sayfalanmış, filtreli
export const getListings = async (params: {
  type?: number;
  provinceCode?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ListingPagedResult> => {
  const res = await api.get('/Listing', { params });
  return res.data.data;
};

// GET /api/Listing/my
export const getMyListings = async (): Promise<Listing[]> => {
  const res = await api.get('/Listing/my');
  return res.data.data;
};

// GET /api/Listing/{id}
export const getListingById = async (id: string): Promise<Listing> => {
  const res = await api.get(`/Listing/${id}`);
  return res.data.data;
};

// POST /api/Listing
export const createListing = async (data: CreateListingParams): Promise<{ id: string }> => {
  const res = await api.post('/Listing', data);
  return res.data.data;
};

// PUT /api/Listing/{id}
export const updateListing = async (id: string, data: UpdateListingParams): Promise<void> => {
  await api.put(`/Listing/${id}`, data);
};

// DELETE /api/Listing/{id}
export const deleteListing = async (id: string): Promise<void> => {
  await api.delete(`/Listing/${id}`);
};
