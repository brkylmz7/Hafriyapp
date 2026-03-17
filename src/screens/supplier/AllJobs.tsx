import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, Platform, Alert, ActionSheetIOS, ScrollView, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CITIES } from '../../constants/cities';
import { DISTRICTS } from '../../constants/districts';
import { useAppSelector } from '../../hooks';
import { getMarketJobs } from '../../services/jobSiteService';
import { mapJobFromApi } from '../../utils/jobMapper';

const YELLOW = '#FFD500';
const LIGHT_YELLOW = '#FFF2B3';
const GRAY = '#F4F4F4';
const DARK = '#222';

const ActionItem = ({ icon, label, onPress }: { icon: any; label: string; onPress?: () => void; }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
    <Image style={{ width: 20, height: 20 }} source={icon} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const JobDetailModal = ({
  visible,
  job,
  onClose,
}: {
  visible: boolean;
  job: any;
  onClose: () => void;
}) => {
  if (!job) return null;

  const phones: string[] = job.phone
    ? job.phone.split(',').map((p: string) => p.trim())
    : [];

  const provinceLabel =
    CITIES.find(c => c.value === job.provinceCode)?.label ?? '-';

  const handleCallPress = (contactPhone?: string) => {
    if (!contactPhone) return;
    const list = contactPhone
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (list.length === 1) {
      Linking.openURL(`tel:${list[0]}`);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Numara Seç',
          options: ['İptal', ...list],
          cancelButtonIndex: 0,
        },
        i => {
          if (i > 0) Linking.openURL(`tel:${list[i - 1]}`);
        },
      );
    } else {
      Alert.alert(
        'Numara Seç',
        '',
        list.map(p => ({
          text: p,
          onPress: () => Linking.openURL(`tel:${p}`),
        })),
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          {/* HEADER */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>İş Detayları</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modalStyles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          <ScrollView style={modalStyles.contentScroll} contentContainerStyle={modalStyles.content}>
            <Text style={modalStyles.label}>İŞ ADI</Text>
            <Text style={modalStyles.value}>{job.site}</Text>

            <Text style={modalStyles.label}>FİRMA</Text>
            <Text style={modalStyles.value}>{job.company}</Text>

            <View style={modalStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>BÖLGE</Text>
                <Text style={modalStyles.value}>{provinceLabel}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>SAATLER</Text>
                <Text style={modalStyles.value}>
                  {job.loadingStartTime || '??'} - {job.loadingEndTime || '??'}
                </Text>
              </View>
            </View>

            {!!job.description && (
              <>
                <Text style={modalStyles.label}>AÇIKLAMA</Text>
                <ScrollView style={modalStyles.descriptionScroll} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
                  <Text style={modalStyles.value}>{job.description}</Text>
                </ScrollView>
              </>
            )}

            {/* TEKLİFLER (Hafriyat) */}
            {job.jobType !== 1 && job.dumps?.length > 0 && (
              <>
                <Text style={modalStyles.label}>TEKLİFLER</Text>
                {job.dumps.map((d: any, i: number) => (
                  <View key={i} style={modalStyles.offerRow}>
                    <Text style={modalStyles.offerText}>{d.place}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={modalStyles.offerCash}>{d.cash}</Text>
                      {d.fuel !== '-' && (
                        <Text style={modalStyles.offerFuel}>{d.fuel}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ROTALAR (Kum/Mıcır) */}
            {job.jobType === 1 && job.routes?.length > 0 && (
              <>
                <Text style={modalStyles.label}>ROTALAR</Text>
                {job.routes.map((r: any, i: number) => (
                  <View key={i} style={modalStyles.routeBox}>
                    <View style={modalStyles.routeRow}>
                      <Text style={modalStyles.routeLabel}>Yükleme</Text>
                      <Text style={modalStyles.routeValue}>{r.loading}</Text>
                    </View>
                    <View style={modalStyles.routeRow}>
                      <Text style={modalStyles.routeLabel}>Boşaltma</Text>
                      <Text style={modalStyles.routeValue}>{r.unloading}</Text>
                    </View>
                    <View style={[modalStyles.routeRow, { borderBottomWidth: 0 }]}>
                      <Text style={modalStyles.routeLabel}>₺/Ton</Text>
                      <Text style={[modalStyles.routeValue, { color: '#2E7D32', fontWeight: '700' }]}>{r.cash}</Text>
                      {r.material !== '-' && (
                        <>
                          <Text style={[modalStyles.routeLabel, { marginLeft: 16 }]}>Malzeme</Text>
                          <Text style={modalStyles.routeValue}>{r.material}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={modalStyles.footer}>
            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={onClose}
            >
              <Text style={modalStyles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.callBtn}
              onPress={() => handleCallPress(job.phone)}
            >
              <Text style={modalStyles.callText}>📞 Şimdi Ara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};



const AllJobs = () => {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPadding = tabBarHeight + insets.bottom;
  const [selectedCity, setSelectedCity] = useState<number>(340);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const token = useAppSelector(state => state.auth.token);

  // İl değişince ilçe seçimlerini sıfırla
  useEffect(() => {
    setSelectedDistricts([]);
  }, [selectedCity]);

  // Seçili ile ait ilçeler
  const availableDistricts = useMemo(
    () => DISTRICTS[selectedCity] ?? [],
    [selectedCity],
  );

  const toggleDistrict = (value: string) => {
    setSelectedDistricts(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value],
    );
  };

  /** 🔍 Firma + Şantiye + İlçe Araması */
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(item => {
      const matchesSearch =
        !q ||
        item.company?.toLowerCase().includes(q) ||
        item.site?.toLowerCase().includes(q);
      const matchesDistrict =
        selectedDistricts.length === 0 ||
        selectedDistricts.includes(item.districtName);
      return matchesSearch && matchesDistrict;
    });
  }, [search, jobs, selectedDistricts]);

  useEffect(() => {
    fetchJobs();
  }, [selectedCity]);

  const openCityPicker = () => {
    const options = ['İptal', ...CITIES.map(c => c.label)];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 0) return;

          const city = CITIES[buttonIndex - 1];
          setSelectedCity(city.value);
        },
      );
    } else {
      Alert.alert(
        'İl Seç',
        undefined,
        CITIES.map(city => ({
          text: city.label,
          onPress: () => setSelectedCity(city.value),
        })),
        { cancelable: true },
      );
    }
  };
  const handleCallPress1 = (phone?: string) => {
    console.log('123123123123')
    if (!phone) return;
    const phones = phone
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    if (phones.length === 0) return;
    console.log('phone', phones)
    // ✅ TEK NUMARA → DİREKT ARA
    if (phones.length === 1) {
      Linking.openURL(`tel:${phones[0]}`);
      return;
    }

    // ✅ BİRDEN FAZLA NUMARA
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Numara Seç',
          options: ['İptal', ...phones],
          cancelButtonIndex: 0,
        },
        index => {
          if (index > 0) {
            Linking.openURL(`tel:${phones[index - 1]}`);
          }
        },
      );
    } else {
      Alert.alert(
        'Numara Seç',
        '',
        phones.map(phone => ({
          text: phone,
          onPress: () => Linking.openURL(`tel:${phone}`),
        })),
        { cancelable: true },
      );
    }
  };

  const handleLocationPress = (url?: string) => {
    if (!url) {
      Alert.alert('Hata', 'Konum bilgisi bulunamadı.');
      return;
    }
    Linking.openURL(url).catch(err => {
      console.error('An error occurred', err);
      Alert.alert('Hata', 'Harita açılamadı.');
    });
  };

  const fetchJobs = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await getMarketJobs(token, selectedCity);
      const mapped = response.map(mapJobFromApi);
      console.log('response', response)
      setJobs(mapped);
    } catch (e) {
      console.log('Market jobs error', e);
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.cardHeader}>
        <Image source={item.logo} style={styles.logo} />

        <View style={styles.titleArea}>
          <View style={{ flexDirection: 'column' }}>
            <View style={{ backgroundColor: '#F7B500', borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, width: '55%', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.jopType}>{item.jobType === 1 ? 'Kum & Mıcır' : 'Hafriyat Döküm'}</Text>
            </View>
            <Text style={styles.company}>{item.company}</Text>
          </View>
          <Text style={styles.site}>{item.site}</Text>
        </View>

        <TouchableOpacity style={styles.moreBtn} onPress={() => {
          setSelectedJob(item);
          setDetailVisible(true);
        }}>
          <Image style={{ width: 20, height: 20 }} source={require('../../../assets/icons/dots.png')} />
          <Text style={styles.moreText}>Ayrıntılar</Text>
        </TouchableOpacity>
      </View>

      {/* ACTIONS */}
      <View style={styles.actionRow}>
        <ActionItem
          icon={require('../../../assets/icons/location.png')}
          label="Konum"
          onPress={() => handleLocationPress(item.locationUrl)}
        />
        <ActionItem
          icon={require('../../../assets/icons/phone-call.png')}
          label="Arama"
          onPress={() => handleCallPress1(item.phone)}
        />
        <ActionItem icon={require('../../../assets/icons/send.png')} label="Paylaş" />
        {/* <ActionItem icon={require('../../../assets/icons/dots.png')} label="Ayrıntılar" /> */}
      </View>

      {/* TABLE */}
      {item.jobType === 1 ? (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Rota</Text>
            <Text style={styles.th}>₺/Ton</Text>
          </View>
          {item.routes.map((r: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                {r.loading} → {r.unloading}
              </Text>
              <Text style={styles.td}>{r.cash}</Text>
            </View>
          ))}
        </>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={styles.th}>Döküm</Text>
            <Text style={styles.th}>Nakit</Text>
            <Text style={styles.th}>Mazot</Text>
          </View>
          {item.dumps.map((d: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.td}>{d.place}</Text>
              <Text style={styles.td}>{d.cash}</Text>
              <Text style={styles.td}>{d.fuel}</Text>
            </View>
          ))}
        </>
      )}

      {/* STATUS */}
      <View style={[styles.statusBar, { backgroundColor: item.statusColor }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (

    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <JobDetailModal
        visible={detailVisible}
        job={selectedJob}
        onClose={() => setDetailVisible(false)}
      />
      <FlatList
        style={{ flex: 1 }}
        data={filteredJobs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchJobs}
        showsVerticalScrollIndicator={false}
        // 🔥 iOS otomatik inset kapat
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>
              Bu il için aktif iş bulunamadı
            </Text>
          ) : null
        }
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: bottomPadding,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.searchRow}>
              {/* SEARCH */}
              <TextInput
                placeholder="Firma veya şantiye ara"
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />

              {/* CITY DROPDOWN */}
              <View>
                <TouchableOpacity
                  style={styles.citySelect}
                  onPress={openCityPicker}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cityText}>
                    {selectedCity
                      ? CITIES.find(c => c.value === selectedCity)?.label
                      : 'İl'}
                  </Text>
                  <Image
                    source={require('../../../assets/icons/down-arrow.png')}
                    style={{ width: 14, height: 14 }}
                  />
                </TouchableOpacity>

                {cityOpen && (
                  <View style={styles.cityDropdown}>
                    <FlatList
                      data={CITIES}
                      keyExtractor={item => item.value.toString()}
                      style={{ maxHeight: 260 }}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.cityItem}
                          onPress={() => {
                            setSelectedCity(item.value);
                            setCityOpen(false);
                          }}
                        >
                          <Text style={styles.cityItemText}>{item.label}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* İLÇE FİLTRESİ */}
            {availableDistricts.length > 0 && (
              <View style={styles.districtWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.districtScroll}
                >
                  {availableDistricts.map(d => {
                    const active = selectedDistricts.includes(d.value);
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[styles.districtChip, active && styles.districtChipActive]}
                        onPress={() => toggleDistrict(d.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.districtChipText, active && styles.districtChipTextActive]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {selectedDistricts.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearDistricts}
                    onPress={() => setSelectedDistricts([])}
                  >
                    <Text style={styles.clearDistrictsText}>Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        }

      />
    </SafeAreaView>
  );
};

export default AllJobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY,
  },

  /* SEARCH */
  searchBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    width: '60%',
    fontSize: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    // extra depth
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 22,
    padding: 16,
    // 🔥 GÜÇLÜ SHADOW
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 1, height: 3 },
    elevation: 8,
  },

  /* HEADER */
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: YELLOW,
    marginRight: 12,
  },
  titleArea: {
    flex: 1,
  },
  company: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  jopType: {
    fontSize: 13,
    fontWeight: '400',
    color: DARK,
  },
  site: {
    fontSize: 15,
    color: '#666',
    marginTop: 2,
  },
  moreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 10,
  },

  /* ACTIONS */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 38,
    marginVertical: 14,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  /* TABLE */
  tableHeader: {
    flexDirection: 'row',
    marginBottom: '2%',
    marginLeft: '10%',
  },
  th: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: '1%',
    marginLeft: '10%',
  },
  td: {
    flex: 1,
    fontSize: 14,
    color: DARK,
  },

  /* STATUS */
  statusBar: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  listWrapper: {
    flex: 1, // 🔥 ekranın geri kalanını kaplar
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  citySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    width: '60%',
    shadowOffset: { width: 1, height: 3 },
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  cityText: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK,
  },

  cityDropdown: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    zIndex: 100,
    paddingVertical: 6,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  cityItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  cityItemText: {
    fontSize: 14,
    color: DARK,
  },

  districtWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },

  districtScroll: {
    gap: 8,
    paddingRight: 8,
  },

  districtChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },

  districtChipActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },

  districtChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },

  districtChipTextActive: {
    color: '#111',
    fontWeight: '800',
  },

  clearDistricts: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFE0E0',
    borderRadius: 20,
  },

  clearDistrictsText: {
    fontSize: 11,
    color: '#C62828',
    fontWeight: '700',
  },

});
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: '88%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },

  contentScroll: {
    flexShrink: 1,
  },

  header: {
    backgroundColor: '#FFF7E0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },

  close: {
    fontSize: 18,
    color: '#555',
  },

  content: {
    padding: 16,
  },

  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    marginBottom: 14,
  },

  descriptionScroll: {
    maxHeight: 200, // Açıklama için sabit bir maksimum yükseklik
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F7B500',
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#FFF7E0',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  footer: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },

  closeBtn: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },

  callBtn: {
    flex: 1,
    backgroundColor: '#FFA500',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  callText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  offerText: {
    fontSize: 13,
    color: DARK,
    flex: 1,
  },

  offerCash: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },

  offerFuel: {
    fontSize: 12,
    color: '#1565C0',
    marginTop: 2,
  },

  routeBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },

  routeLabel: {
    fontSize: 11,
    color: '#999',
    width: 60,
  },

  routeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  phoneIcon: {
    fontSize: 18,
  },
});

