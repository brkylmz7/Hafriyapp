import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, ActionSheetIOS } from 'react-native';
import { CITIES } from '../constants/cities';
import { DISTRICTS } from '../constants/districts';
import { useAppSelector } from '../hooks';
const YELLOW = '#FFD500';
const CARD_BG = '#fff';

type JobCategory = 'HAFRIYAT' | 'KUM_MICIR';

/* ================= TYPES ================= */

type Offer = {
  dumpLocation: string; // Hafriyat ekranındaki döküm yeri / teklif adı
  cash: string;         // decimal
  fuel: string;         // decimal
};

type Route = {
  loadLocation: string;
  unloadLocation: string;
  cashPerTon: string;   // decimal
  material: string;
};

type AppInputProps = Omit<TextInputProps, 'onChangeText'> & {
  label?: string;
  flex?: boolean;
  height?: number;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

type CardProps = {
  title: string;
  children: React.ReactNode;
};

type NewJobModalProps = {
  onClose: () => void;
};

/* ================= COMPONENT ================= */

export default function NewJobModal({ onClose }: NewJobModalProps) {
  const insets = useSafeAreaInsets();

  // ✅ Auth’tan alacaksın
  const companyId = useAppSelector(state => state.auth.user?.id) // TODO: useAppSelector(state => state.auth.user?.id)

  const [jobCategory, setJobCategory] = useState<JobCategory>('HAFRIYAT');

  const [siteName, setSiteName] = useState('');
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState<string>('');
  
  const [locationUrl, setLocationUrl] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [description, setDescription] = useState('');

  /* Hafriyat → Teklifler */
  const [offers, setOffers] = useState<Offer[]>([
    { dumpLocation: '', cash: '', fuel: '' },
  ]);

  /* Kum / Mıcır → Rotalar */
  const [routes, setRoutes] = useState<Route[]>([
    { loadLocation: '', unloadLocation: '', cashPerTon: '', material: '' },
  ]);

  const [startTime, setStartTime] = useState(''); // "09:00"
  const [endTime, setEndTime] = useState('');     // "18:00"
  const [fuelStock, setFuelStock] = useState(''); // int
  const districts = useMemo(() => {
    if (!provinceCode) return [];
    return DISTRICTS[provinceCode] ?? [];
  }, [provinceCode]);
  
  /* ================= HELPERS ================= */

  const addOffer = () =>
    setOffers(o => [...o, { dumpLocation: '', cash: '', fuel: '' }]);

  const removeOffer = (i: number) =>
    setOffers(o => o.filter((_, idx) => idx !== i));

  const updateOffer = (i: number, key: keyof Offer, value: string) => {
    setOffers(o => {
      const clone = [...o];
      clone[i] = { ...clone[i], [key]: value };
      return clone;
    });
  };

  const addRoute = () =>
    setRoutes(r => [
      ...r,
      { loadLocation: '', unloadLocation: '', cashPerTon: '', material: '' },
    ]);

  const removeRoute = (i: number) =>
    setRoutes(r => r.filter((_, idx) => idx !== i));

  const updateRoute = (i: number, key: keyof Route, value: string) => {
    setRoutes(r => {
      const clone = [...r];
      clone[i] = { ...clone[i], [key]: value };
      return clone;
    });
  };

  const addPhone = () => setPhones(p => [...p, '']);
  const removePhone = (i: number) =>
    setPhones(p => p.filter((_, idx) => idx !== i));

  const updatePhone = (i: number, value: string) => {
    setPhones(p => {
      const clone = [...p];
      clone[i] = value;
      return clone;
    });
  };

  /* ================= PARSERS (int/decimal) ================= */

  const toDecimalOrNull = (v: string) => {
    // "12,5" gelirse nokta yapalım
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const toIntOr0 = (v: string) => {
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n)) return 0;
    return Math.trunc(n);
  };

  /* ================= REQUEST ================= */

  const request = useMemo(() => {
    const isKum = jobCategory === 'KUM_MICIR';

    // Hafriyat: tekliflerden cash/fuel var mı?
    const hasCash = isKum
      ? routes.some(r => (toDecimalOrNull(r.cashPerTon) ?? 0) > 0)
      : offers.some(o => (toDecimalOrNull(o.cash) ?? 0) > 0);

    const hasFuel = isKum
      ? false
      : offers.some(o => (toDecimalOrNull(o.fuel) ?? 0) > 0);

    // ✅ Backend’de gördüğün gibi:
    // Offer1* / Offer2* alanlarını ilk 2 teklife bağlıyoruz.
    const o1 = offers[0];
    const o2 = offers[1];

    // Kum/Mıcır: rotaları ExtraOffersJson olarak gönderiyoruz
    const extraOffersJson = isKum
      ? JSON.stringify(
          routes.map((r, idx) => ({
            offerNo: idx + 1,
            loading: r.loadLocation,
            unloading: r.unloadLocation,
            cashPerTon: toDecimalOrNull(r.cashPerTon) ?? 0,
            material: r.material,
          }))
        )
      : offers.length > 2
        ? JSON.stringify(
            offers.slice(2).map((o, idx) => ({
              offerNo: idx + 3,
              dumpLocation: o.dumpLocation,
              cash: toDecimalOrNull(o.cash) ?? 0,
              fuel: toDecimalOrNull(o.fuel) ?? 0,
            }))
          )
        : null;

    return {
      CompanyId: companyId,                // Guid
      Name: siteName,                      // string
      ProvinceCode: provinceCode ?? 0,
      DistrictName: districtName,           // string
      LocationUrl: locationUrl,            // string
      ContactPhone: phones ?? '',       // string
      ContactPhones: phones?.length,               // string[]
      Description: description,            // string

      JobType: isKum ? 1 : 0,              // int (0/1)

      Offer1Name: !isKum ? (o1?.dumpLocation ?? null) : null, // string?
      Offer1Cash: !isKum ? (toDecimalOrNull(o1?.cash ?? '') ?? 0) : null, // decimal?
      Offer1Fuel: !isKum ? (toDecimalOrNull(o1?.fuel ?? '') ?? 0) : null, // decimal?

      Offer2Name: !isKum ? (o2?.dumpLocation ?? null) : null,
      Offer2Cash: !isKum ? (toDecimalOrNull(o2?.cash ?? '') ?? 0) : null,
      Offer2Fuel: !isKum ? (toDecimalOrNull(o2?.fuel ?? '') ?? 0) : null,

      ExtraOffersJson: extraOffersJson,    // string?

      HasCash: hasCash,                    // bool
      HasFuel: hasFuel,                    // bool
      HasSand: isKum,                      // bool (kum/mıcır = true)

      FuelStock: toIntOr0(fuelStock),      // int
      FuelLiters: null as number | null,   // decimal?
      SandFuelLiters: null as number | null, // decimal?

      LoadingStartTime: startTime,         // string
      LoadingEndTime: endTime,             // string

      CashAmount: null as number | null,   // decimal? (sende backend'de null görünüyor)
      SandFuelLitersAmount: null as number | null, // güvenli dursun
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCategory, siteName, provinceCode, districtName, locationUrl, phones, description, offers, routes, startTime, endTime, fuelStock]);

  const handleSave = () => {
    console.log('📦 CREATE JOB REQUEST', JSON.stringify(request, null, 2));

    // burada servise gideceksin:
    // await createJobSite(token, request);
    // onClose();
  };

  /* ================= RENDER ================= */

  return (
    <View style={styles.wrapper}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni İş Kur</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* İŞ TÜRÜ */}
        <View style={styles.categoryWrapper}>
          <TouchableOpacity
            style={[styles.categoryBtn, jobCategory === 'HAFRIYAT' && styles.categoryBtnActive]}
            onPress={() => setJobCategory('HAFRIYAT')}
            activeOpacity={0.85}
          >
            <Text style={jobCategory === 'HAFRIYAT' ? styles.categoryTextActive : styles.categoryText}>
              Hafriyat / Döküm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtn, jobCategory === 'KUM_MICIR' && styles.categoryBtnActive]}
            onPress={() => setJobCategory('KUM_MICIR')}
            activeOpacity={0.85}
          >
            <Text style={jobCategory === 'KUM_MICIR' ? styles.categoryTextActive : styles.categoryText}>
              Kum / Mıcır
            </Text>
          </TouchableOpacity>
        </View>

        {/* TEMEL BİLGİLER */}
        <Card title="Temel Bilgiler">
          <AppInput
            label="İş Adı *"
            placeholder="Örn: Esenler TOKİ"
            value={siteName}
            onChangeText={setSiteName}
          />

<Text style={styles.label}>İl *</Text>

<TouchableOpacity
  style={styles.input}
  onPress={() =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...CITIES.map(c => c.label), 'İptal'],
        cancelButtonIndex: CITIES.length,
      },
      index => {
        if (index < CITIES.length) {
          setProvinceCode(CITIES[index].value);
          setDistrictName('');
        }
      }
    )
  }
>
  <Text style={{ color: provinceCode ? '#111' : '#8E8E93' }}>
    {provinceCode
      ? CITIES.find(c => c.value === provinceCode)?.label
      : 'İl seçin'}
  </Text>
</TouchableOpacity>


<Text style={styles.label}>İlçe *</Text>

<TouchableOpacity
  style={[
    styles.input,
    !provinceCode && { opacity: 0.5 },
  ]}
  disabled={!provinceCode}
  onPress={() =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...districts.map(d => d.label), 'İptal'],
        cancelButtonIndex: districts.length,
      },
      index => {
        if (index < districts.length) {
          setDistrictName(districts[index].value);
        }
      }
    )
  }
>
  <Text style={{ color: districtName ? '#111' : '#8E8E93' }}>
    {districtName || 'İlçe seçin'}
  </Text>
</TouchableOpacity>


          <AppInput
            label="Konum Linki"
            placeholder="Google Maps linki"
            value={locationUrl}
            onChangeText={setLocationUrl}
          />

          <Text style={styles.label}>İrtibat Telefonları *</Text>

          {phones.map((p, i) => (
            <View key={i} style={styles.phoneRow}>
              <AppInput
                placeholder="05xx xxx xx xx"
                keyboardType="phone-pad"
                value={p}
                onChangeText={v => updatePhone(i, v)}
                flex
              />

              {phones.length > 1 && (
                <TouchableOpacity onPress={() => removePhone(i)}>
                  <Text style={styles.delete}>Sil</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity onPress={addPhone}>
            <Text style={styles.addText}>+ Telefon Ekle</Text>
          </TouchableOpacity>

          <AppInput
            label="Açıklama"
            placeholder="Ek bilgiler (opsiyonel)"
            value={description}
            onChangeText={setDescription}
            multiline
            height={110}
          />
        </Card>

        {/* HAFRİYAT → TEKLİFLER */}
        {jobCategory === 'HAFRIYAT' && (
          <Card title="Teklifler">
            {offers.map((o, i) => (
              <View key={i} style={styles.offerBox}>
                <View style={styles.routeHeader}>
                  <Text style={styles.offerTitle}>Teklif {i + 1}</Text>

                  {offers.length > 1 && (
                    <TouchableOpacity onPress={() => removeOffer(i)}>
                      <Text style={styles.delete}>Sil</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <AppInput
                  placeholder="Döküm yeri adı (örn: Cebeci)"
                  value={o.dumpLocation}
                  onChangeText={v => updateOffer(i, 'dumpLocation', v)}
                />

                <View style={styles.row}>
                  <AppInput
                    placeholder="Nakit ₺"
                    keyboardType="numeric"
                    value={o.cash}
                    onChangeText={v => updateOffer(i, 'cash', v)}
                    flex
                  />
                  <AppInput
                    placeholder="Yakıt Lt"
                    keyboardType="numeric"
                    value={o.fuel}
                    onChangeText={v => updateOffer(i, 'fuel', v)}
                    flex
                  />
                </View>

                <Text style={styles.hint}>Nakit veya yakıttan en az birini girin</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.addOfferBtn} onPress={addOffer}>
              <Text style={styles.addOfferText}>+ Teklif Ekle</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* KUM/MICIR → ROTALAR */}
        {jobCategory === 'KUM_MICIR' && (
          <Card title="Rotalar">
            <Text style={styles.routeInfo}>
              Yükleme ve boşaltma noktalarını belirleyin. Her rota için ton fiyatı girebilirsiniz.
            </Text>

            {routes.map((r, i) => (
              <View key={i} style={styles.routeBox}>
                <View style={styles.routeHeader}>
                  <Text style={styles.offerTitle}>Rota {i + 1}</Text>
                  {routes.length > 1 && (
                    <TouchableOpacity onPress={() => removeRoute(i)}>
                      <Text style={styles.delete}>Sil</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <AppInput
                  placeholder="Yükleme Yeri"
                  value={r.loadLocation}
                  onChangeText={v => updateRoute(i, 'loadLocation', v)}
                />

                <AppInput
                  placeholder="Boşaltma Yeri"
                  value={r.unloadLocation}
                  onChangeText={v => updateRoute(i, 'unloadLocation', v)}
                />

                <View style={styles.row}>
                  <AppInput
                    placeholder="Ton başına ₺"
                    keyboardType="numeric"
                    value={r.cashPerTon}
                    onChangeText={v => updateRoute(i, 'cashPerTon', v)}
                    flex
                  />
                  <AppInput
                    placeholder="Malzeme Cinsi"
                    value={r.material}
                    onChangeText={v => updateRoute(i, 'material', v)}
                    flex
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addOfferBtn} onPress={addRoute}>
              <Text style={styles.addOfferText}>+ Rota Ekle</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* ÇALIŞMA SAATLERİ */}
        <Card title="Çalışma Saatleri">
          <View style={styles.row}>
            <AppInput
              placeholder="Başlangıç (09:00)"
              value={startTime}
              onChangeText={setStartTime}
              flex
            />
            <AppInput
              placeholder="Bitiş (18:00)"
              value={endTime}
              onChangeText={setEndTime}
              flex
            />
          </View>
          <Text style={styles.hint}>Şantiyenin çalışma saat aralığı</Text>
        </Card>

        {/* YAKIT STOKU */}
        <Card title="Yakıt Stoku">
          <AppInput
            placeholder="Şantiyedeki toplam yakıt (Litre)"
            keyboardType="numeric"
            value={fuelStock}
            onChangeText={setFuelStock}
          />
          <Text style={styles.hint}>Şantiyede bulunan toplam yakıt miktarı</Text>
        </Card>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={{ fontWeight: '800' }}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= UI HELPERS ================= */

const Card = ({ title, children }: CardProps) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const AppInput = ({
  label,
  flex,
  height,
  onChangeText,
  placeholder,
  ...props
}: AppInputProps) => (
  <View style={{ flex: flex ? 1 : undefined }}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      {...props}
      placeholder={placeholder}
      placeholderTextColor="#8E8E93"
      onChangeText={onChangeText}
      style={[
        styles.input,
        height ? { height, textAlignVertical: 'top', paddingTop: 12 } : undefined,
      ]}
    />
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F3F3F3' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    elevation: 4,
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  back: { fontSize: 22 },
  headerTitle: { fontWeight: '800', fontSize: 16 },

  container: { padding: 14 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },
  cardTitle: { fontWeight: '800', marginBottom: 10, fontSize: 18 },

  label: { fontSize: 12, color: '#666', marginTop: 10, marginBottom: 6 },

  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#111',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },

  row: { flexDirection: 'row', gap: 10 },

  offerBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  routeBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },

  offerTitle: { fontWeight: '800', fontSize: 16 },

  addText: { color: '#666', fontSize: 12, marginTop: 4 },

  addOfferBtn: {
    borderWidth: 1,
    borderColor: YELLOW,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addOfferText: { fontWeight: '800', fontSize: 15 },

  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  delete: { color: '#E53935', fontSize: 13, fontWeight: '700' },

  hint: { fontSize: 12, color: '#999', marginTop: -6, marginBottom: 6 },

  routeInfo: { fontSize: 12, color: '#777', marginBottom: 10 },

  categoryWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
  },
  categoryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  categoryBtnActive: { backgroundColor: YELLOW },
  categoryText: { color: '#666', fontWeight: '700' },
  categoryTextActive: { color: '#111', fontWeight: '900' },

  footer: {
    position: 'absolute',
    bottom: 5,
    width: '100%',
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    gap: 15,
    borderTopWidth: 1,
    borderColor: '#f2f2f2',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: YELLOW,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5,
  },
});
