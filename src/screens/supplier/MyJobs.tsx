import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

import NewJobModal from '../../components/NewJobModal';
import { deleteJobSite, toggleJobSiteActive } from '../../services/jobSiteNewService';
import { useAppSelector } from '../../hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const YELLOW = '#FFD500';
const API_URL = 'https://api.hafriyapp.com/api';

type Job = {
  id: string;
  name: string;
  provinceCode: number;
  districtName: string;
  locationUrl: string;
  contactPhone: string;
  description: string;
  jobType: number;
  offer1Name: string;
  offer1Cash: number;
  offer1Fuel: number;
  extraOffersJson: string;
  hasSand: boolean;
  fuelStock: number;
  loadingStartTime: string;
  loadingEndTime: string;
  canEdit: boolean;
  isActive: boolean;
  fuelLiters: number;
  sandFuelLiters: number;
  // Diğer alanlar API'den geliyorsa...
};

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
  raw: Job; // 🛠 Veriyi sakla
};

export default function MyJobs() {
  const navigation = useNavigation<any>(); // Add navigation hook
  const token = useAppSelector(state => state.auth.token);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'HAFRIYAT' | 'KUM'>('ALL');
  const insets = useSafeAreaInsets();

  const fetchJobs = async () => {
    if (!token) return;
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/JobSite`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      });

      console.log('🚀 JobSite Data:', JSON.stringify(res.data, null, 2));

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
        raw: item, // 🛠 Full data
      }));

      setJobs(mapped);
    } catch (err) {
      console.log('JobSite fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleNewJob = () => {
    setSelectedJob(undefined); // Yeni iş
    setShowModal(true);
  };

  const handleCloseModal = (refresh?: boolean) => {
    setShowModal(false);
    setSelectedJob(undefined);
    if (refresh) {
      fetchJobs(); // 🛠 Listeyi yenile
    }
  };

  const handleToggleActive = (job: JobUI) => {
    const nextActive = !job.isActive;
    const msg = nextActive
      ? 'Bu işi tekrar yayına almak istiyor musunuz?'
      : 'Bu işi yayından kaldırmak istiyor musunuz?';

    Alert.alert(nextActive ? 'Yayına Al' : 'Yayından Kaldır', msg, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Evet',
        onPress: async () => {
          if (!token) return;
          try {
            await toggleJobSiteActive(token, job.id, nextActive);
            fetchJobs();
          } catch (error) {
            Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
          }
        },
      },
    ]);
  };

  const handleFinishJob = (jobId: string) => {
    Alert.alert(
      "İşi Bitir",
      "İşi bitirmek istediğinize emin misiniz?",
      [
        {
          text: "Vazgeç",
          style: "cancel"
        },
        {
          text: "Evet",
          onPress: async () => {
            if (token) {
              try {
                await deleteJobSite(token, jobId);
                fetchJobs(); // Listeyi yenile
                Alert.alert("Başarılı", "İş başarıyla sonlandırıldı.");
              } catch (error) {
                console.error("Delete job error:", error);
                Alert.alert("Hata", "İş sonlandırılırken bir sorun oluştu.");
              }
            }
          }
        }
      ]
    );
  };


  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(item => {
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'KUM' && item.raw.jobType === 1) ||
        (filterType === 'HAFRIYAT' && item.raw.jobType !== 1);
      const matchesSearch =
        !q || item.site.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [jobs, search, filterType]);

  const renderItem = ({ item }: { item: JobUI }) => {
    const isKum = item.raw.jobType === 1;

    return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.site}>{item.site}</Text>
        <Text style={styles.jobType}>
          {isKum ? 'Kum & Mıcır' : 'Hafriyat Döküm'}
        </Text>

        <View style={{ marginTop: '2%' }}>
          <Text style={styles.info}>Bugün atılan seferler: {item.today}</Text>
          <Text style={styles.info}>Toplam atılan seferler: {item.total}</Text>
          <Text style={styles.info}>Ödemesi yapılan: {item.paid}</Text>
          <Text style={styles.info}>Ödemesi yapılmayan: {item.unpaid}</Text>
        </View>
      </View>

      <View style={styles.right}>
        {/* Hafriyat: yakıt kutusu */}
        {!isKum && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Yakıt Durumu</Text>
            <Text style={styles.infoBoxRow}>Kalan: {item.fuelLeft}</Text>
            <Text style={styles.infoBoxRow}>Verilen: {item.fuelGiven}</Text>
          </View>
        )}

        {/* Kum/Mıcır: malzeme miktarı kutusu */}
        {isKum && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Malzeme Miktarı</Text>
            <Text style={styles.infoBoxLabel}>Verilen:</Text>
            <Text style={styles.infoBoxValue}>{item.total} Ton</Text>
            <View style={styles.infoBoxCashRow}>
              <Text style={styles.infoBoxCash}>Nakit Verilen: {item.paid}₺</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, item.isActive ? styles.actionBtnDanger : styles.actionBtnSuccess]}
          onPress={() => handleToggleActive(item)}
        >
          <Text style={item.isActive ? styles.actionBtnDangerText : styles.actionBtnSuccessText}>
            {item.isActive ? 'Yayından Kaldır' : 'Yayına Al'}
          </Text>
        </TouchableOpacity>
        {item.canEdit && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item.raw)}>
            <Text style={styles.actionBtnText}>Düzenle</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('JobDetails', { job: item.raw })}
        >
          <Text style={styles.actionBtnText}>İşi Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

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

        {/* ARAMA */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="İş adına göre ara..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* FİLTRE */}
        <View style={styles.filterRow}>
          {(['ALL', 'HAFRIYAT', 'KUM'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {type === 'ALL' ? 'Tümü' : type === 'HAFRIYAT' ? 'Hafriyat' : 'Kum & Mıcır'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={{ marginTop: '2%' }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          }
        />
      </View>

      {/* ➕ YENİ İŞ KUR */}
      <TouchableOpacity style={styles.fab} onPress={handleNewJob}>
        <Text style={styles.plus}>＋</Text>
        <Text style={styles.fabText}>Yeni İş Kur</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide">
        <NewJobModal onClose={handleCloseModal} initialJob={selectedJob} />
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

  jobType: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '700',
    marginBottom: 4,
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

  infoBox: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    width: 110,
    alignItems: 'center',
    elevation: 2,
  },

  infoBoxTitle: {
    fontSize: 11,
    color: '#555',
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },

  infoBoxLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },

  infoBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
  },

  infoBoxCashRow: {
    marginTop: 4,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  infoBoxCash: {
    fontSize: 10,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
  },

  infoBoxRow: {
    fontSize: 11,
    color: '#2E6B1F',
    fontWeight: '600',
    textAlign: 'center',
  },

  actionBtn: {
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    marginTop: 6,
    width: 110,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  actionBtnText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },

  actionBtnDanger: {
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#E53935',
  },

  actionBtnDangerText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '700',
    textAlign: 'center',
  },

  actionBtnSuccess: {
    backgroundColor: '#EDFBF0',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },

  actionBtnSuccessText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
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
    paddingTop: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },

  searchRow: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 42,
    fontSize: 14,
    color: '#111',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },

  filterChip: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },

  filterChipActive: {
    backgroundColor: YELLOW,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  filterChipTextActive: {
    color: '#111',
    fontWeight: '800',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
});
