import React, { useMemo, useState, useEffect } from 'react';
import { createJobSite, updateJobSite } from '../services/jobSiteNewService';
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
import { Platform, ActionSheetIOS, Alert } from 'react-native';
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
  onClose: (refresh?: boolean) => void;
  initialJob?: any;
};

/* ================= COMPONENT ================= */

export default function NewJobModal({ onClose, initialJob }: NewJobModalProps) {
  const insets = useSafeAreaInsets();

  const user = useAppSelector(state => state.auth.user);
  const companyId = useAppSelector(state => state.auth.companyId) || user?.companyId; // Fallback to user if needed
  console.log('asdasd', companyId);

  if (!companyId) {
    console.warn("⚠️ CompanyId bulunamadı! Lütfen tekrar giriş yapın.");
  }

  const token = useAppSelector(state => state.auth.token);
  // const token = useAppSelector(state => state.auth.token);

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

  // 🛠 EDİT MODU: Verileri doldur
  useEffect(() => {
    if (initialJob) {
      console.log('📝 EDIT MODE:', initialJob);
      setSiteName(initialJob.name);
      setProvinceCode(initialJob.provinceCode);
      // District set timeout ile veya direk (list memo oldugu icin sorun olmaz)
      setDistrictName(initialJob.districtName);
      setLocationUrl(initialJob.locationUrl);
      setDescription(initialJob.description);

      if (initialJob.contactPhone) {
        setPhones(initialJob.contactPhone.split(', '));
      }

      setFuelStock(String(initialJob.fuelStock || ''));
      setStartTime(initialJob.loadingStartTime || '');
      setEndTime(initialJob.loadingEndTime || '');

      // 🛠 Job Type Logic
      const isKum = initialJob.jobType === 1; // 1: Kum/Mıcır, 0: Hafriyat
      setJobCategory(isKum ? 'KUM_MICIR' : 'HAFRIYAT');

      // Offer/Route Parsing
      if (isKum) {
        // KUM MICIR - all routes are stored in extraOffersJson
        const newRoutes: Route[] = [];
        if (initialJob.extraOffersJson) {
          try {
            const extras = JSON.parse(initialJob.extraOffersJson);
            extras.forEach((e: any) => {
              newRoutes.push({
                loadLocation: e.loading,
                unloadLocation: e.unloading,
                cashPerTon: String(e.cash ?? e.cashPerTon ?? ''),
                material: e.material || '',
              });
            });
          } catch (e) { }
        }
        // Fallback: old format where route[0] was in offer1Name
        if (newRoutes.length === 0 && initialJob.offer1Name) {
          const parts = initialJob.offer1Name.split(' - ');
          newRoutes.push({
            loadLocation: parts[0] || '',
            unloadLocation: parts[1] || '',
            cashPerTon: String(initialJob.offer1Cash || ''),
            material: '',
          });
        }
        setRoutes(newRoutes.length > 0 ? newRoutes : [{ loadLocation: '', unloadLocation: '', cashPerTon: '', material: '' }]);

      } else {
        // HAFRIYAT
        const newOffers: Offer[] = [];
        // 1. Teklif
        if (initialJob.offer1Name) {
          newOffers.push({
            dumpLocation: initialJob.offer1Name,
            cash: String(initialJob.offer1Cash || ''),
            fuel: String(initialJob.offer1Fuel || '')
          });
        }
        // Diğer teklifler
        if (initialJob.extraOffersJson) {
          try {
            const extras = JSON.parse(initialJob.extraOffersJson);
            extras.forEach((e: any) => {
              newOffers.push({
                dumpLocation: e.dumpLocation || e.name,
                cash: String(e.cash),
                fuel: String(e.fuel)
              });
            });
          } catch (e) { }
        }
        setOffers(newOffers.length > 0 ? newOffers : [{ dumpLocation: '', cash: '', fuel: '' }]);
      }
    }
  }, [initialJob]);

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

  /* ================= HANDLERS ================= */

  const isDirty = useMemo(() => {
    if (!initialJob) return true; // Yeni kayıt

    // Basit alanlar
    if (siteName !== initialJob.name) return true;
    if (provinceCode !== initialJob.provinceCode) return true;
    if (districtName !== initialJob.districtName) return true;
    if ((locationUrl || '') !== (initialJob.locationUrl || '')) return true;
    if ((description || '') !== (initialJob.description || '')) return true;

    const currentPhones = phones.filter(p => p.trim() !== '').join(', ');
    if (currentPhones !== (initialJob.contactPhone || '')) return true;

    if (String(toIntOr0(fuelStock)) !== String(initialJob.fuelStock || 0)) return true;
    if ((startTime || '') !== (initialJob.loadingStartTime || '')) return true;
    if ((endTime || '') !== (initialJob.loadingEndTime || '')) return true;

    // Kategori
    const isKum = jobCategory === 'KUM_MICIR';
    if (isKum !== initialJob.hasSand) return true;

    // Offers / Routes Comparison
    // 1. Offer1 Name/Cash/Fuel (only for HAFRIYAT)
    if (!isKum) {
      let currentOffer1Name = '';
      let currentOffer1Cash = 0;
      let currentOffer1Fuel = 0;
      if (offers.length > 0) {
        currentOffer1Name = offers[0].dumpLocation;
        currentOffer1Cash = Number(offers[0].cash || '0');
        currentOffer1Fuel = Number(offers[0].fuel || '0');
      }
      if (currentOffer1Name !== (initialJob.offer1Name || '')) return true;
      if (currentOffer1Cash !== (initialJob.offer1Cash || 0)) return true;
      if (currentOffer1Fuel !== (initialJob.offer1Fuel || 0)) return true;
    }

    // 2. ExtraOffers (JSON)
    let currentExtraJson: string | null = null;

    if (isKum) {
      if (routes.length > 0) {
        currentExtraJson = JSON.stringify(
          routes.map((r, idx) => ({
            offerNo: idx + 1,
            loading: r.loadLocation,
            unloading: r.unloadLocation,
            cash: toDecimalOrNull(r.cashPerTon) ?? 0,
            material: r.material,
          }))
        );
      }
    } else {
      if (offers.length > 1) {
        const limitOffers = offers.slice(1);
        currentExtraJson = JSON.stringify(
          limitOffers.map((o, idx) => ({
            offerNo: idx + 2,
            dumpLocation: o.dumpLocation,
            cash: toDecimalOrNull(o.cash) ?? 0,
            fuel: toDecimalOrNull(o.fuel) ?? 0,
            name: o.dumpLocation
          }))
        );
      }
    }

    const initialExtra = initialJob.extraOffersJson || null;
    if (currentExtraJson !== initialExtra) {
      return true;
    }

    return false; // Hiçbir şey değişmedi
  }, [
    siteName, provinceCode, districtName, locationUrl, description, phones,
    fuelStock, startTime, endTime, jobCategory, offers, routes, initialJob
  ]);


  /* ================= HANDLERS ================= */

  const handleSave = async () => {
    if (!companyId) {
      Alert.alert("Uyarı", "Firma bilgisi alınamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    try {
      // 1. Telefonları birleştir
      const contactPhonesString = phones.filter(p => p.trim() !== '').join(', ');

      const isKum = jobCategory === 'KUM_MICIR';

      // 2. ExtraOffersJson ve Offer1/2 Mantığı
      let extraOffersJson: string | null = null;
      let offer1Name: string | null = null;
      let offer1Cash: number | null = null;
      let offer1Fuel: number | null = null;

      // Offer2 Alanlarını boş geçiyoruz, hepsi JSON'a
      const offer2Name: string | null = null;
      const offer2Cash: number | null = null;
      const offer2Fuel: number | null = null;

      if (isKum) {
        // All routes go into extraOffersJson; offer1Name/Cash/Fuel stay null
        if (routes.length > 0) {
          extraOffersJson = JSON.stringify(
            routes.map((r, idx) => ({
              offerNo: idx + 1,
              loading: r.loadLocation,
              unloading: r.unloadLocation,
              cash: toDecimalOrNull(r.cashPerTon) ?? 0,
              material: r.material,
            }))
          );
        }

      } else {
        // HAFRIYAT
        if (offers.length > 0) {
          const o1 = offers[0];
          offer1Name = o1.dumpLocation;
          offer1Cash = toDecimalOrNull(o1.cash);
          offer1Fuel = toDecimalOrNull(o1.fuel);
        }

        if (offers.length > 1) {
          const limitOffers = offers.slice(1);
          extraOffersJson = JSON.stringify(
            limitOffers.map((o, idx) => ({
              offerNo: idx + 2,
              dumpLocation: o.dumpLocation,
              cash: toDecimalOrNull(o.cash) ?? 0,
              fuel: toDecimalOrNull(o.fuel) ?? 0,
              name: o.dumpLocation
            }))
          );
        }
      }

      const hasCash = isKum
        ? routes.some(r => (toDecimalOrNull(r.cashPerTon) ?? 0) > 0)
        : offers.some(o => (toDecimalOrNull(o.cash) ?? 0) > 0);

      const hasFuel = isKum
        ? false
        : offers.some(o => (toDecimalOrNull(o.fuel) ?? 0) > 0);

      // FULL PAYLOAD (Curl Example uyumlu)
      const payload = {
        companyId: companyId, // Curl'de küçük harf, serviste createJob için PascalCase kullanmıştık ama PUT için küçük olabilir. User curl'ü küçük harf CompanyId.
        // DİKKAT: Create işleminde CompanyId (Pascal) göndermiştik. 
        // User'ın attığı curl örneğinde "companyId" var. 
        // C# backend genelde case-insensitive olabilir ama biz user örneğine uyalım.
        // Ancak Create de Pascal idi. Hepsini Pascal yapıp, curl'deki companyId'yi de Pascal yapmak daha güvenli olabilir mi?
        // User "servisin detaylarını paylaşıyorum" diyerek JSON attı. Orada camelCase var.
        // Create ile Update farklı naming convention kullanıyor olabilir mi?
        // createJobSite -> CompanyId demişim.
        // Ancak update için camelCase kullanalım.
        name: siteName,
        jobType: isKum ? 1 : 0,
        provinceCode: provinceCode ?? 0,
        districtName: districtName,
        locationUrl: locationUrl,
        description: description,
        contactPhone: contactPhonesString,
        fuelStock: toIntOr0(fuelStock),

        offer1Name: offer1Name,
        offer1Cash: offer1Cash ?? 0,
        offer1Fuel: offer1Fuel ?? 0,

        offer2Name: offer2Name,
        offer2Cash: offer2Cash ?? 0,
        offer2Fuel: offer2Fuel ?? 0,

        extraOffersJson: extraOffersJson,

        hasFuel: hasFuel,
        fuelLiters: 0, // Curl 0

        hasSand: isKum,
        sandFuelLiters: 0, // Curl 0

        hasCash: hasCash,
        cashAmount: 0, // Curl 0

        loadingStartTime: startTime,
        loadingEndTime: endTime,

        isActive: initialJob ? initialJob.isActive : true // Mevcut durumu
      };

      console.log('🚀 Sending Payload:', JSON.stringify(payload, null, 2));

      if (token) {
        if (initialJob) {
          // UPDATE
          await updateJobSite(token, initialJob.id, payload);
          Alert.alert("Güncellendi", "İş ilanı başarıyla güncellendi.", [{ text: "Tamam", onPress: () => onClose(true) }]);
        } else {
          // CREATE 
          // Create servisi PascalCase bekliyor olabilir mi? Daha önce CompanyId gitmişti.
          // Yeni bir obje createPayload yapalım veya serviste düzeltelim.
          // Şimdilik Create'i bozmuyorum, Update için camelCase payload kullanıyorum.

          // Create için PascalCase Keyleri
          const createPayload = {
            CompanyId: companyId,
            Name: siteName,
            ProvinceCode: provinceCode ?? 0,
            DistrictName: districtName,
            LocationUrl: locationUrl,
            ContactPhone: contactPhonesString,
            Description: description,
            JobType: isKum ? 1 : 0,
            Offer1Name: offer1Name,
            Offer1Cash: offer1Cash ?? 0,
            Offer1Fuel: offer1Fuel ?? 0,
            Offer2Name: null,
            Offer2Cash: null,
            Offer2Fuel: null,
            ExtraOffersJson: extraOffersJson,
            HasCash: hasCash,
            HasFuel: hasFuel,
            HasSand: isKum,
            FuelStock: toIntOr0(fuelStock),
            FuelLiters: null,
            SandFuelLiters: null,
            LoadingStartTime: startTime,
            LoadingEndTime: endTime,
            CashAmount: null
          };

          await createJobSite(token, createPayload);
          Alert.alert("Başarılı", "İş ilanı başarıyla oluşturuldu.", [{ text: "Tamam", onPress: () => onClose(true) }]);
        }
      } else {
        console.warn('Token missing');
        Alert.alert("Hata", "Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
      }

    } catch (error) {
      console.error('Job save failed', error);
      Alert.alert("Hata", "İş kaydedilirken bir sorun oluştu.");
    }
  };

  /* ================= RENDER ================= */

  return (
    <View style={styles.wrapper}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => onClose()} style={styles.backBtn}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{initialJob ? 'İşi Düzenle' : 'Yeni İş Kur'}</Text>
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

        {/* YAKIT STOKU - Sadece Hafriyat/Döküm için */}
        {jobCategory === 'HAFRIYAT' && (
          <Card title="Yakıt Stoku">
            <AppInput
              placeholder="Şantiyedeki toplam yakıt (Litre)"
              keyboardType="numeric"
              value={fuelStock}
              onChangeText={setFuelStock}
            />
            <Text style={styles.hint}>Şantiyede bulunan toplam yakıt miktarı</Text>
          </Card>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onClose()}>
          <Text>Vazgeç</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !isDirty && { backgroundColor: '#ccc' }]}
          onPress={handleSave}
          disabled={!isDirty}
        >
          <Text style={{ fontWeight: '800' }}>{initialJob ? 'Güncelle' : 'Kaydet'}</Text>
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
