import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import NewJobModal from '../../components/NewJobModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const YELLOW = '#FFD500';

const jobs = [
  {
    id: '1',
    site: 'GÜNEŞLİ ŞANTİYESİ 1',
    today: 17,
    total: 242,
    paid: 161,
    unpaid: 81,
    fuelLeft: '3250 lt',
    fuelGiven: '5750 lt',
  },
  {
    id: '2',
    site: 'ESENLER ŞANTİYESİ 2',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
  {
    id: '3',
    site: 'ESENLER ŞANTİYESİ 3',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
  {
    id: '4',
    site: 'ESENLER ŞANTİYESİ 4',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
  {
    id: '5',
    site: 'ESENLER ŞANTİYESİ 5',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
  {
    id: '6',
    site: 'ESENLER ŞANTİYESİ 6',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
  {
    id: '7',
    site: 'ESENLER ŞANTİYESİ 7',
    today: 0,
    total: 57,
    paid: 48,
    unpaid: 9,
    fuelLeft: '0 lt',
    fuelGiven: '0 lt',
  },
];

export default function MyJobs() {
  const [showModal, setShowModal] = useState(false);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.site}>{item.site}</Text>

        <View style={{ marginTop: '5%' }}>
          <Text style={styles.info}>Bugün atılan seferler: {item.today}</Text>
          <Text style={styles.info}>Toplam atılan seferler: {item.total}</Text>
          <Text style={styles.info}>Ödemesi yapılan: {item.paid}</Text>
          <Text style={styles.info}>Ödemesi yapılmayan: {item.unpaid}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.fuelBox}>
          <Text style={styles.fuel}>Kalan: {item.fuelLeft}</Text>
          <Text style={styles.fuel}>Verilen: {item.fuelGiven}</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn}>
          <Text>Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Text>İşi Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ marginTop: '-8%' }}>
        <Text style={styles.title}>FİRMANIZA AİT İŞLER</Text>
      </View>

      <FlatList showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} data={jobs} keyExtractor={i => i.id} renderItem={renderItem} contentContainerStyle={{ paddingTop: 10, paddingBottom: 40, flexGrow: 1, padding: '3%' }} />

      {/* ➕ YENİ İŞ KUR */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.plus}>＋</Text>
        <Text style={styles.fabText}>Yeni İş Kur</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide">
        <NewJobModal onClose={() => setShowModal(false)} />
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    // padding: 10,
  },

  title: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 10,
    color: '#111',
  },

  /* 🔹 CARD */
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 14,

    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,

    // Android Shadow
    elevation: 4,
  },

  site: {
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
    color: '#111',
  },

  info: {
    fontSize: 12,
    color: '#666',
    marginBottom: '1%',
    marginTop: '1%',
  },

  /* 🔹 RIGHT COLUMN */
  right: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 10,
  },

  fuelBox: {
    backgroundColor: '#EAF8D8',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    width: 120,
    height: 40,
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 0.27,

    elevation: 2,
  },

  fuel: {
    fontSize: 11,
    color: '#2E6B1F',
    fontWeight: '600',
  },

  actionBtn: {
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 6,
    width: 90,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 0.27,

    elevation: 2,
  },

  /* 🔹 FLOATING ACTION BUTTON */
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: YELLOW,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  plus: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    lineHeight: 26,
  },

  fabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },
});
