import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const YELLOW = '#FFD500';

const companies = [
  {
    id: '1',
    name: 'ÖRNEK 1 HAFRİYAT',
    message: 'Kamil: Esenler yüklememiz başladı',
    time: '12:30',
    logo: require('../../../assets/logokarakalem.png'),
  },
  {
    id: '2',
    name: 'ÖRNEK 2 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '11:20',
    logo: require('../../../assets/icons/excavator.png'),
  },
  {
    id: '3',
    name: 'ÖRNEK 3 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '10:20',
    logo: require('../../../assets/icons/excavator.png'),
  },
  {
    id: '4',
    name: 'ÖRNEK 4 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '10:20',
    logo: require('../../../assets/logokarakalem.png'),
  },
  {
    id: '5',
    name: 'ÖRNEK 5 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '10:20',
    logo: require('../../../assets/icons/excavator.png'),
  },
  {
    id: '6',
    name: 'ÖRNEK 6 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '10:20',
    logo: require('../../../assets/logokarakalem.png'),
  },
  {
    id: '7',
    name: 'ÖRNEK 7 HAFRİYAT',
    message: 'Kadir: Yükleme devam ediyor.',
    time: '10:20',
    logo: require('../../../assets/icons/excavator.png'),
  },
];

export default function SupplierHome() {
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');

  // 🔍 FİLTRELENMİŞ LİSTE
  const filteredCompanies = useMemo(() => {
    if (!searchText.trim()) return companies;

    const text = searchText.toLowerCase();

    return companies.filter(item => item.name.toLowerCase().includes(text) || item.message.toLowerCase().includes(text));
  }, [searchText]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('CompanyChat', { company: item })} activeOpacity={0.7}>
      <Image source={item.logo} style={styles.avatar} />

      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {item.message}
        </Text>
      </View>

      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FİRMA SAYFALARI</Text>

      {/* 🔍 ARAMA */}
      <TextInput placeholder="Ara" value={searchText} onChangeText={setSearchText} style={styles.search} placeholderTextColor="#888" clearButtonMode="while-editing" />

      <FlatList data={filteredCompanies} keyExtractor={item => item.id} renderItem={renderItem} ItemSeparatorComponent={() => <View style={styles.divider} />} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.emptyText}>Sonuç bulunamadı</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  search: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    marginRight: 12,
    backgroundColor: '#FFD500',
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 13,
  },
  message: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 13,
  },
});
