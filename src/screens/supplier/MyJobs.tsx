import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

import NewJobModal from '../../components/NewJobModal';
import { useAppSelector } from '../../hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const YELLOW = '#FFD500';
const API_URL = 'https://api.hafriyapp.com/api';

type JobUI = {
  id: string;
  site: string;
  today: number;
  total: number;
  paid: number;
  unpaid: number;
  fuelLeft: string;
  fuelGiven: string;
  canEdit: boolean;
  isActive: boolean;
};

export default function MyJobs() {
  const token = useAppSelector(state => state.auth.token);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!token) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_URL}/JobSite`, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: '*/*',
          },
        });

        const mapped: JobUI[] = res.data.map((item: any) => ({
          id: item.id,
          site: item.name,
          today: 0,        // başka servisten gelecek
          total: 0,
          paid: 0,
          unpaid: 0,
          fuelLeft: `${item.fuelStock ?? 0} lt`,
          fuelGiven: '0 lt',
          canEdit: item.canEdit,
          isActive: item.isActive,
        }));

        setJobs(mapped);
      } catch (err) {
        console.log('JobSite fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [token]);

  const renderItem = ({ item }: { item: JobUI }) => (
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

        {item.canEdit && (
          <TouchableOpacity style={styles.actionBtn}>
            <Text>Düzenle</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtn}>
          <Text>{item.isActive ? 'İşi Aç' : 'Pasif'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text>{'İşi Kapat'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={YELLOW} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[
    styles.content,
    { marginTop: -insets.top + 15 }, // 👈 BOŞLUĞU YOK EDEN SATIR
  ]}>
    <Text style={styles.title}>FİRMANIZA AİT İŞLER</Text>

    <FlatList
      data={jobs}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      style={{marginTop:'5%'}}
    />
  </View>

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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },

  title: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 4,
    marginBottom: 6,
    color: '#111',
  },

  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
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
    marginVertical: '1%',
  },

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
    elevation: 2,
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: YELLOW,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
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
  content: {
    flex: 1,
    paddingTop: 4, // 🔥 kritik değer
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 120, // tabbar + FAB
  },
});
