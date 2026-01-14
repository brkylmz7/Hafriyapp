import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, Platform, Alert, ActionSheetIOS } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CITIES } from '../../constants/cities';
import { useAppSelector } from '../../hooks';
import { getMarketJobs } from '../../services/jobSiteService';
import { mapJobFromApi } from '../../utils/jobMapper';

const YELLOW = '#FFD500';
const LIGHT_YELLOW = '#FFF2B3';
const GRAY = '#F4F4F4';
const DARK = '#222';

const jobs = [
  {
    id: '1',
    company: 'KAYA HAFRİYAT',
    site: 'GÜNEŞLİ ŞANTİYESİ',
    logo: require('../../../assets/icons/excavator.png'),
    dumps: [
      { place: 'CEBECİ', cash: '2000₺', fuel: '40lt' },
      { place: 'BOLLUCA', cash: '4000₺', fuel: '65lt' },
      { place: 'AL-GÖTÜR', cash: '7000₺', fuel: '75lt' },
    ],
    status: 'Yükleme Devam Ediyor',
    statusColor: '#C8E6C9',
  },
  {
    id: '2',
    company: 'YILMAZ HAFRİYAT',
    site: 'ESENLER ŞANTİYESİ',
    logo: require('../../../assets/logokarakalem.png'),
    dumps: [
      { place: 'CEBECİ', cash: '2000₺', fuel: '40lt' },
      { place: 'BOLLUCA', cash: '4000₺', fuel: '65lt' },
    ],
    status: 'Gece 10’a kadar yükleme devam edecek',
    statusColor: LIGHT_YELLOW,
  },
  {
    id: '3',
    company: 'KAYA HAFRİYAT',
    site: 'GÜNEŞLİ ŞANTİYESİ',
    logo: require('../../../assets/icons/excavator.png'),
    dumps: [
      { place: 'CEBECİ', cash: '2000₺', fuel: '40lt' },
      { place: 'BOLLUCA', cash: '4000₺', fuel: '65lt' },
      { place: 'AL-GÖTÜR', cash: '7000₺', fuel: '75lt' },
    ],
    status: 'Yükleme Devam Ediyor',
    statusColor: '#C8E6C9',
  },
];

const ActionItem = ({ icon, label }: { icon: any; label: string }) => (
  <TouchableOpacity style={styles.actionItem} activeOpacity={0.7}>
    <Image style={{ width: 20, height: 20 }} source={icon} />
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const AllJobs = () => {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bottomPadding = tabBarHeight + insets.bottom;
  const [selectedCity, setSelectedCity] = useState<number>(340);
  const [cityOpen, setCityOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAppSelector(state => state.auth.token);
  /** 🔍 Firma + Şantiye Araması */
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
  
    if (!q) return jobs;
  
    return jobs.filter(
      item =>
        item.company?.toLowerCase().includes(q) ||
        item.site?.toLowerCase().includes(q),
    );
  }, [search, jobs]); // ✅
  
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
  const fetchJobs = async () => {
    if (!token) return;
  
    setLoading(true);
    try {
      const response = await getMarketJobs(token, selectedCity);
      const mapped = response.map(mapJobFromApi);
      console.log('response',response)
      console.log('mapped',mapped)
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
          <Text style={styles.company}>{item.company}</Text>
          <Text style={styles.site}>{item.site}</Text>
        </View>

        <TouchableOpacity style={styles.moreBtn}>
          <Image style={{ width: 20, height: 20 }} source={require('../../../assets/icons/dots.png')} />
          <Text style={styles.moreText}>Ayrıntılar</Text>
        </TouchableOpacity>
      </View>

      {/* ACTIONS */}
      <View style={styles.actionRow}>
        <ActionItem icon={require('../../../assets/icons/location.png')} label="Konum" />
        <ActionItem icon={require('../../../assets/icons/phone-call.png')} label="Arama" />
        <ActionItem icon={require('../../../assets/icons/send.png')} label="Paylaş" />
        {/* <ActionItem icon={require('../../../assets/icons/dots.png')} label="Ayrıntılar" /> */}
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={styles.th}>Döküm</Text>
        <Text style={styles.th}>Nakit</Text>
        <Text style={styles.th}>Mazot</Text>
      </View>

      {/* TABLE ROWS */}
      {item.dumps.map((d: any, index: number) => (
        <View key={index} style={styles.tableRow}>
          <Text style={styles.td}>{d.place}</Text>
          <Text style={styles.td}>{d.cash}</Text>
          <Text style={styles.td}>{d.fuel}</Text>
        </View>
      ))}

      {/* STATUS */}
      <View style={[styles.statusBar, { backgroundColor: item.statusColor }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
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
    width:'60%',
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
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
  },
  site: {
    fontSize: 13,
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
    flexDirection:'row',
    justifyContent:'space-between',
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
    width:'60%',
    shadowOffset: { width: 1, height: 3 },
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  
  cityText: {
    fontSize: 13,
    fontWeight:'500',
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
  
});
