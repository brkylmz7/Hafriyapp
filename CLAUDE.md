# Hafriyapp — React Native Mobile

## Proje Özeti
Hafriyat (toprak taşıma) sektörü için dijital platform. Araç sahipleri şantiye oluşturur, sürücüler seferleri kaydeder. Sefer takibi, ödeme durumu, offline kuyruk ve pazar yeri içerir.

**Platform:** iOS + Android | **Dil:** TypeScript + React Native 0.82.1

---

## Stack

| Kategori | Kütüphane | Versiyon |
|----------|-----------|----------|
| UI Framework | React Native | 0.82.1 |
| Navigation | React Navigation (stack + drawer + bottom tabs) | 7.x |
| State | Redux Toolkit + redux-persist | 2.11 / 6.0 |
| HTTP | Axios | 1.13 |
| Güvenli Depolama | react-native-keychain | 10.0 |
| Lokal Depolama | AsyncStorage | 2.2 |
| OTP Input | react-native-confirmation-code-field | 8.0 |
| Resim | react-native-image-picker | 8.2 |
| Animasyon | react-native-reanimated | 4.2 |
| Real-time | @microsoft/signalr | 10.0 (kurulu, henüz bağlanmamış) |

---

## API

- **Base URL:** `https://api.hafriyapp.com/api`
- **Auth:** JWT Bearer Token
- **Referans Docs:** `/Users/anadoluefes/Desktop/Harfiyapp/Web/HafriyApp-main/MOBILE_API_DOCS.md`

> **ÖNEMLİ:** `MOBILE_API_DOCS.md` Production base URL olarak `https://217.195.207.24` gösteriyor.
> Mevcut `src/services/api.ts` `https://api.hafriyapp.com/api` kullanıyor — uyum sağlanmalı.

---

## Navigasyon Hiyerarşisi

```
RootNavigator
├── isLoggedIn = false  →  AuthNavigator
│   ├── SelectRoleScreen   (Şoför / Firma&Araç Sahibi seçimi)
│   ├── LoginScreen        (Telefon girişi → SMS gönder)
│   └── OtpScreen          (6 haneli kod doğrula → token al)
│
└── isLoggedIn = true   →  AppNavigator (Drawer)
    ├── CustomHeader       (Sarı başlık + hamburger)
    ├── CustomDrawerContent (Logo, Anasayfa, Profilim, İlanlarım, Çıkış)
    │
    └── BottomTabs (role'e göre)
        ├── [driver]   DriverStack / AllJobs / DriverJobs
        └── [supplier] SupplierStack / AllJobs / MyJobsStack / SupplierVehicles

Drawer'da gizli (hoisted):
  CompanyChat, CompanyDetails, CompanyEdit, ProfileEdit
```

---

## Ekranlar

### Auth
| Ekran | Dosya | Açıklama |
|-------|-------|----------|
| SelectRoleScreen | `screens/Auth/SelectRoleScreen.tsx` | Rol seçimi |
| LoginScreen | `screens/Auth/LoginScreen.tsx` | Telefon girişi (format: 0XXXXXXXXXX) |
| OtpScreen | `screens/Auth/OtpScreen.tsx` | 6 haneli kod, 120s sayaç |

### Sürücü
| Ekran | Dosya |
|-------|-------|
| DriverHome | `screens/driver/DriverHome.tsx` |
| AllJobs | `screens/driver/AllJobs.tsx` |
| DriverJobs | `screens/driver/DriverJobs.tsx` |

### Araç Sahibi / Firma
| Ekran | Dosya | Açıklama |
|-------|-------|----------|
| SupplierHome | `screens/supplier/SupplierHome.tsx` | Chat grupları listesi |
| AllJobs | `screens/supplier/AllJobs.tsx` | Pazar iş ilanları |
| MyJobs | `screens/supplier/MyJobs.tsx` | Kendi şantiyeleri |
| JobDetails | `screens/supplier/JobDetails.tsx` | Şantiye detay + seferler |
| SupplierVehicles | `screens/supplier/SupplierVehicles.tsx` | Araç yönetimi |
| CompanyChat | `screens/supplier/CompanyChat.tsx` | Grup chat |
| CompanyDetails | `screens/supplier/CompanyDetailsScreen.tsx` | Firma bilgileri |
| CompanyEdit | `screens/supplier/CompanyEditScreen.tsx` | Firma düzenleme |

### Ortak
- `screens/ProfileScreen.tsx`
- `screens/ProfileEditScreen.tsx`
- `screens/MyAds.tsx`

---

## Redux Store

```
store/
├── index.ts              # redux-persist ile AsyncStorage'a persist
└── slices/
    ├── authSlice.ts      # ✅ Persist edilir
    ├── pendingHaulSlice.ts # ✅ Persist edilir (offline kuyruk)
    └── counterSlice.ts   # ⚠️ Kullanılmıyor — temizlenmeli
```

### AuthState
```typescript
{
  role: 'driver' | 'supplier' | null
  phone: string
  token: string | null
  isLoggedIn: boolean
  companyId: string | null
  user: {
    id, phoneNumber, firstName, lastName,
    companyId, companyName, role, userType,
    phoneNumberConfirmed, createdDate
  } | null
}
```

### PendingHaulState (offline kuyruk)
```typescript
// Offline kaydedilen seferler — internet gelince yüklenecek (henüz implemente değil)
{
  hauls: Array<{
    localId, jobSiteId, plateNumber, paymentType,
    tonage, cashAmount, fuelAmount, dumpLocation,
    note, isPrintedReceipt, timeOfHaul, createdAt
  }>
}
```

---

## Servisler ve Endpoint'ler

### `services/api.ts` — Axios instance
- `baseURL: 'https://api.hafriyapp.com/api'`
- Interceptor: keychain'den token okur → `Authorization: Bearer` ekler

### `services/authService.ts`
| Fonksiyon | Method | Endpoint |
|-----------|--------|----------|
| `login(phone)` | POST | `/Auth/login` → `{ phoneNumber: '+9' + phone }` |
| `verifySms(phone, code)` | POST | `/Auth/verify-sms` → token + userId + userType + companyId |
| `register(payload)` | POST | `/Auth/register` |

> **⚠️ Bug:** `'+9' + phone` — phone zaten '0' ile başlıyor → "+905..." yerine "+95..." oluyor.

### `services/userService.ts`
| Fonksiyon | Endpoint |
|-----------|----------|
| `getUserById(userId, token)` | GET `/User/{userId}` |
| `updateUserProfile(payload, token)` | PUT `/User/profile` |
| `deleteAccount(token)` | DELETE `/User/account` |
| `deactivateAccount(token)` | POST `/User/account/deactivate` |
| `getMyCompanies(token)` | GET `/company` |
| `getCompanyById(id, token)` | GET `/company/{id}` |
| `addAuthorizedUser(...)` | POST `/company/{id}/authorized-user` |
| `removeAuthorizedUser(...)` | DELETE `/company/{id}/users/{userId}` |
| `updateCompanyDetails(...)` | PUT `/company/{id}` |

### `services/vehicleService.ts`
| Fonksiyon | Endpoint |
|-----------|----------|
| `getVehicles(token)` | GET `/Vehicle` |
| `createVehicle(plate, companyId, driverPhone, token)` | POST `/Vehicle` |
| `updateVehicle(id, plate, companyId, token)` | PUT `/Vehicle/{id}` |
| `deleteVehicle(id, token)` | DELETE `/Vehicle/{id}` |
| `assignDriver(vehicleId, phone, token)` | POST `/Vehicle/{id}/assign-driver` |
| `getVehicleDriver(vehicleId, token)` | GET `/Vehicle/{id}/drivers` |
| `removeDriver(vehicleId, driverUserId, token)` | DELETE `/Vehicle/{id}/remove-driver/{uid}` |
| `driverAddVehicle(plate)` | POST `/Vehicle/driver-add` |
| `driverLeaveVehicle(vehicleId)` | DELETE `/Vehicle/driver-leave/{id}` |

### `services/haulService.ts` — Sefer Yönetimi
| Fonksiyon | Endpoint |
|-----------|----------|
| `getHauls(token)` | GET `/Haul/my` |
| `getHaulsFiltered(token, start, end)` | GET `/Haul/my/filtered` |
| `getHaulsByVehicle(vehicleId, token)` | GET `/Haul/vehicle/{id}` |
| `createHaul(params, token)` | POST `/Haul` |
| `updateHaulPayment(params, token)` | PATCH `/Haul/{id}/payment` |
| `deleteHaul(id, token)` | DELETE `/Haul/{id}` |

**HaulApi tipi:** `vehicleId?, jobSiteId, plateNumber, paymentType (0=Nakit/1=Yakıt/2=Her ikisi), tonage, cashAmount, fuelAmount, dumpLocation, note, isPaid, isPrintedReceipt, timeOfHaul (ISO UTC), createdDate, isVisibleToVehicleOwner`

### `services/jobSiteNewService.ts` — Şantiye Yönetimi
| Fonksiyon | Endpoint |
|-----------|----------|
| `getJobSites(token)` | GET `/JobSite` |
| `getJobSite(token, id)` | GET `/JobSite/{id}` |
| `createJobSite(token, data)` | POST `/JobSite` |
| `updateJobSite(token, id, data)` | PUT `/JobSite/{id}` |
| `toggleJobSiteActive(token, id, isActive)` | PUT `/JobSite/{id}/toggle-active` |
| `deleteJobSite(token, id)` | DELETE `/JobSite/{id}` |
| `getJobHauls(token, jobSiteId)` | GET `/Haul/jobsite/{id}` |

> `saveHaulsVisibility` / `getHaulsVisibility` → AsyncStorage'da `jobsite_hauls_visibility` key'i.

**JobSite Payload (CREATE PascalCase, UPDATE camelCase — backend tutarsızlığı):**
`CompanyId, Name, ProvinceCode, DistrictName, LocationUrl, ContactPhone, Description, SignDescription, JobType (0=Hafriyat/1=Kum-Mıcır), ExtraOffersJson (JSON string), HasCash, HasFuel, HasSand, FuelStock, LoadingStartTime (HH:MM), LoadingEndTime, IsActive, ShowHaulsToVehicleOwners`

### `services/jobSiteService.ts` — Pazar
| Fonksiyon | Endpoint |
|-----------|----------|
| `getMarketJobs(token, provinceCode?, districtName?)` | GET `/JobSite/market` |

### `services/listingService.ts` — İlanlar
| Fonksiyon | Endpoint |
|-----------|----------|
| `getListings(params)` | GET `/Listing` |
| `getMyListings()` | GET `/Listing/my` |
| `getListingById(id)` | GET `/Listing/{id}` |
| `createListing(data)` | POST `/Listing` |
| `updateListing(id, data)` | PUT `/Listing/{id}` |
| `deleteListing(id)` | DELETE `/Listing/{id}` |

**Listing Types:** `0=Araç Kiralama, 1=Tır Pazarı, 2=Şoför İlanı`

### `services/chatService.ts` — Grup Chat
- `getChatGroups`, `createChatGroup`, `getGroupMessages`, `sendMessage`
- `getGroupDetail`, `updateGroupSettings`, `uploadGroupImage`, `deleteGroup`
- `getBlockedPhones`, `addBlockedPhone`, `removeBlockedPhone`

---

## Bileşenler

### `CustomHeader.tsx`
Sarı (#FFD500) global başlık. Logo + başlık + hamburger menü. `DrawerActions.openDrawer()` tetikler.

### `NewJobModal.tsx` (~1200 satır — çok büyük, bölünmeli)
Şantiye oluştur/düzenle modal'ı.
- **Hafriyat Modu:** Çoklu teklif (döküm yeri + nakit ₺ + yakıt lt), görünürlük toggle
- **Kum/Mıcır Modu:** Rotalar (yükleme → boşaltma + ton fiyatı + malzeme cinsi)
- Ortak: İl/İlçe seçici, çalışma saatleri, dirty check, form validasyon
- ⚠️ "Yükleme Açık" toggle JSX'te yorum satırına alındı — değer her zaman `true` olarak servise gönderiliyor
- ⚠️ Gizlenen teklifler (`isVisible: false`) pazar listesinde (`jobMapper.ts`) filtreleniyor; `JobDetails.tsx` (şantiye sahibi görünümü) filtrelemiyor — her iki yerde farklı davranış kasıtlı

---

## Utils

### `utils/secureStore.ts`
```typescript
saveAuth({ token, phone, role, companyId? })  // Keychain'e yazar
getAuth()   // → { phone, token, role, companyId }
clearAuth() // Keychain'i siler
```
Service: `hafriyapp.auth` | Erişim: `ACCESSIBLE.WHEN_UNLOCKED`

### `utils/jobMapper.ts` — `mapJobFromApi(item)`
API response → UI formatı dönüşümü. `extraOffersJson` parse eder (3 farklı format var — legacy uyumluluk).

### `utils/jobSiteMapper.ts` — `mapJobSiteFromApi(item)`
Minimal mapping: name, fuelStock, edit izni.

---

## Constants

- `constants/cities.ts` — 81 il (kod + label). İstanbul ayrımı: Avrupa=340, Anadolu=341.
- `constants/districts.ts` — İl kodu → ilçe listesi. NewJobModal'da kullanılır.

---

## Hooks

- `useAuthBootstrap` — Uygulama başlangıcında keychain'den token restore eder. `HAS_LAUNCHED` ile temiz kurulum detection.
- `useAppDispatch` — Typed Redux dispatch
- `useAppSelector` — Typed Redux selector

---

## Bilinen Sorunlar

| # | Sorun | Dosya | Öncelik |
|---|-------|-------|---------|
| 1 | Phone format bug: `'+9' + phone` → "+95..." | `authService.ts:24` | 🔴 Kritik |
| 2 | API URL: `api.hafriyapp.com` vs `217.195.207.24` | `api.ts:5` | 🔴 Kritik |
| 3 | JobSite payload: CREATE PascalCase, UPDATE camelCase tutarsız | `NewJobModal.tsx` | 🟡 Yüksek |
| 4 | `counterSlice.ts` kullanılmıyor | `store/slices/` | 🟢 Düşük |
| 5 | `pendingHaulSlice` tanımlı ama hiçbir ekran kullanmıyor | `slices/pendingHaulSlice.ts` | 🟡 Yüksek |
| 6 | `@microsoft/signalr` kurulu ama bağlanmıyor (real-time chat yok) | `services/chatService.ts` | 🟡 Yüksek |
| 7 | `useNavigation<any>()` — navigation params typed olmalı | Tüm ekranlar | 🟢 Düşük |
| 8 | `NewJobModal.tsx` ~1200 satır — küçük componente bölünmeli | `components/` | 🟢 Düşük |
| 9 | `IMAGE_BASE` URL hard-coded (SupplierHome + jobMapper) | DRY ihlali | 🟢 Düşük |
| 10 | Listing image upload UI'da yok (service hazır) | `screens/MyAds.tsx` | 🟡 Orta |
| 11 | API JSON casing belirsiz — `HaulApi` tipi camelCase ama API PascalCase dönüyor olabilir; `isHaulVisible()` her iki casing'i kontrol ediyor | `SupplierVehicles.tsx` | 🟡 Yüksek |

---

## Uygulanan Değişiklikler

### Fiş (Receipt) Tasarımı — `JobDetails.tsx` + `SupplierVehicles.tsx`
Her iki ekranda fiş modalı yeniden tasarlandı (web versiyonu ile eşleştirildi):
- **Yapı:** Koyu overlay → beyaz `receiptWrapper` (kart + butonları sarar) → `receiptCard` (sol şerit + içerik)
- **Başlık:** Logo kutusu (`companyLogoPath` varsa uzak URL, yoksa `assets/icons/truck.png`) + firma adı + şantiye adı + saat (sağ üst, küçük font)
- **Gövde:** Satırlar (sol, `flex:1`) + QR kodu (sağ, 76×76px) yan yana
- **Satır formatı:** `"Tarih :"`, `"Seri No :"`, `"Plaka :"`, `"Şoför :"`, `"Döküm :"`, `"Ücret :"`, `"Yetkili :"` — etiket solda gri, değer bold siyah
- **Footer:** Kart dışında — `"Kapat"` (outline) + `"Yazdır"` / `"Onayla"` (koyu)
- Firma adı fallback: `SupplierVehicles`'da `selectedTrip.companyName || user?.companyName`

### Seri No (`autoSerial`) — `JobDetails.tsx` + `SupplierVehicles.tsx`
Web ile aynı format:
```typescript
// 1. API'den serialNumber geldiyse direkt kullan (örn. "26042100010")
// 2. Yoksa: yyMMdd + id'nin ilk 4 karakteri (büyük harf)
if (haul.serialNumber) return haul.serialNumber;
const datePart = `${yy}${mm}${dd}`;
const idPart = haul.id.substring(0, 4).toUpperCase();
return `${datePart}${idPart}`;
```
Sefer kartında tek seri no kutucuğu, tıklayınca kopyalanır (`@react-native-clipboard/clipboard`).

### Manuel Sefer Modal — `JobDetails.tsx`
- Hafriyat modunda **Tonaj alanı kaldırıldı** (değer `0` olarak gönderilir)
- Tek "Kaydet" butonu → iki buton:
  - **"Sanal Fiş Kes"** — `handleManualHaul(false)` → sadece sefer kaydeder, fiş gösterir
  - **"Fiş Kes ve Yazdır"** — `handleManualHaul(true)` → kaydeder + fiş + Share

### Araç Yönetimi Sefer Filtresi — `SupplierVehicles.tsx`
Web'deki `IsVisibleToVehicleOwner` filtresi ile eşleştirildi:
```typescript
const isHaulVisible = (h: any): boolean => {
  const v = h.IsVisibleToVehicleOwner ?? h.isVisibleToVehicleOwner;
  return v !== false; // undefined → görünür (default true)
};
```
Eski yaklaşım (job site bazlı `getHiddenJobSiteIds`) kaldırıldı — per-haul stamp kullanılıyor.

### Chat Geliştirmeleri — `CompanyChat.tsx`
- Mesaja uzun basınca kopyalama (`Clipboard`, 2s geri bildirim)
- `LinkifiedText` bileşeni: URL ve Türkçe telefon numaraları tıklanabilir link
- `TextInput` çok satırlı yapıldı (min 40px, max 120px)

### Offer Görünürlük Mantığı
- `jobMapper.ts` (pazar listesi) — `isVisible: false` teklifler filtrelenir ✅
- `JobDetails.tsx` (şantiye sahibi görünümü) — `isVisible: false` teklifler gösterilir ✅ (kasıtlı fark)

---

## Renkler & Stil Kılavuzu

```
Primary Yellow:  #FFD500
Primary Black:   #000000
Background:      #F3F2F3 / #F3F3F3
Border:          #CFCFCF
Text Muted:      #AAA / #555 / #444
Tab Bar Height:  80px
Border Radius:   12-14px (butonlar), 12px (inputlar)
```

---

## Çalıştırma

```bash
# Metro başlat
npm start

# iOS
bundle exec pod install   # ilk kurulumda
npm run ios

# Android
npm run android

# Test
npm test
```

---

## Slash Command'lar (Bu Projede)

```
/plan             → Yeni özellik planla (implement etmeden önce onayla)
/gsd:do           → Hızlı görev yürüt
/gsd:debug        → Hata ayıkla
/gsd:ui-review    → UI kalite denetimi
/code-review      → Kod inceleme (typescript-reviewer agent)
/verify           → Build + typecheck + lint kontrolü
/brainstorm       → Çözüm alternatifleri üret
/write-plan       → Detaylı implementation planı yaz

# UI/UX arama (react-native stack):
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react-native
```
