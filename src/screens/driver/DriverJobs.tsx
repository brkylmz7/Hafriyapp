import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, ScrollView, Image, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../../hooks';
import { getHauls, getHaulsFiltered, updateHaulPayment, HaulApi } from '../../services/haulService';
import { getVehicles, driverAddVehicle, driverLeaveVehicle } from '../../services/vehicleService';

const YELLOW = '#FFD500';
const IMAGE_BASE = 'https://api.hafriyapp.com';

const buildUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

const PAYMENT_LABELS = ['Nakit', 'Yakıt', 'Nakit + Yakıt'];

type FilterKey = 'all' | 'today' | 'week' | 'month';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'today', label: 'Bugün' },
  { key: 'week', label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay' },
];

type VehicleItem = {
  id: string;
  plateNumber: string;
  isDriver: boolean;
  isCompanyVehicle: boolean;
  companyName?: string;
};

const toISO = (d: Date) => d.toISOString();

const getDateRange = (filter: FilterKey): { start: string; end: string } | null => {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000 - 1);
    return { start: toISO(start), end: toISO(end) };
  }
  if (filter === 'week') {
    const day = now.getDay() || 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    const end = new Date(start.getTime() + 7 * 86400000 - 1);
    return { start: toISO(start), end: toISO(end) };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: toISO(start), end: toISO(end) };
  }
  return null;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const fmtMoney = (n: number) =>
  n > 0 ? n.toLocaleString('tr-TR') + ' ₺' : '';

export default function DriverJobs() {
  const token = useAppSelector(s => s.auth.token) ?? '';

  const [hauls, setHauls] = useState<HaulApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [receiptItem, setReceiptItem] = useState<HaulApi | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Araç state
  const [driverVehicle, setDriverVehicle] = useState<VehicleItem | null | undefined>(undefined);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [addVehicleVisible, setAddVehicleVisible] = useState(false);
  const [addVehiclePlate, setAddVehiclePlate] = useState('');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVehicle();
      fetchData(filter);
    }, [filter]),
  );

  const fetchVehicle = async () => {
    if (!token) return;
    setVehicleLoading(true);
    try {
      const data = await getVehicles(token);
      const vehicles: VehicleItem[] = Array.isArray(data) ? data : [];
      setDriverVehicle(vehicles.find(v => v.isDriver) ?? null);
    } catch {
      setDriverVehicle(null);
    } finally {
      setVehicleLoading(false);
    }
  };

  const fetchData = async (f: FilterKey, silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const range = getDateRange(f);
      const data = range
        ? await getHaulsFiltered(token, range.start, range.end)
        : await getHauls(token);
      setHauls([...data].sort((a, b) => new Date(b.timeOfHaul).getTime() - new Date(a.timeOfHaul).getTime()));
    } catch {
      Alert.alert('Hata', 'Seferler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    const plate = addVehiclePlate.trim();
    if (!plate) {
      Alert.alert('Uyarı', 'Lütfen plaka numarasını girin.');
      return;
    }
    setAddVehicleLoading(true);
    try {
      await driverAddVehicle(plate);
      setAddVehicleVisible(false);
      setAddVehiclePlate('');
      await fetchVehicle();
      Alert.alert('Başarılı', 'Araç başarıyla eklendi ve şoför olarak atandınız.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Araç eklenemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setAddVehicleLoading(false);
    }
  };

  const handleLeaveVehicle = (vehicleId: string) => {
    Alert.alert(
      'Araçtan Ayrıl',
      'Bu araçtan ayrılmak istediğinize emin misiniz? Artık yeni bir araca atanabilirsiniz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            setLeaveLoading(true);
            try {
              await driverLeaveVehicle(vehicleId);
              setDriverVehicle(null);
              Alert.alert('Başarılı', 'Araçtan başarıyla ayrıldınız.');
            } catch {
              Alert.alert('Hata', 'Araçtan ayrılırken bir hata oluştu.');
            } finally {
              setLeaveLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleApprove = async (item: HaulApi) => {
    Alert.alert(
      'Ödemeyi Onayla',
      `${item.companyName || item.jobSiteName} - ${fmtDate(item.timeOfHaul)} tarihli seferin ödemesini onaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            setApprovingId(item.id);
            try {
              await updateHaulPayment({ haulId: item.id, isPaid: true }, token);
              setHauls(prev => prev.map(h => h.id === item.id ? { ...h, isPaid: true } : h));
              if (receiptItem?.id === item.id) setReceiptItem({ ...item, isPaid: true });
            } catch {
              Alert.alert('Hata', 'Ödeme onaylanamadı.');
            } finally {
              setApprovingId(null);
            }
          },
        },
      ],
    );
  };

  /* ─── STATS ─── */
  const total = hauls.length;
  const paid = hauls.filter(h => h.isPaid).length;
  const pending = total - paid;

  /* ─── ARAÇ BANNER ─── */
  const renderVehicleBanner = () => {
    if (vehicleLoading || driverVehicle === undefined) {
      return (
        <View style={vs.loadingWrap}>
          <ActivityIndicator size="small" color={YELLOW} />
          <Text style={vs.loadingText}>Araç bilgisi yükleniyor...</Text>
        </View>
      );
    }

    if (driverVehicle) {
      return (
        <View style={vs.assignedCard}>
          <View style={vs.assignedLeft}>
            <View style={vs.carIconWrap}>
              <Text style={vs.carEmoji}>🚛</Text>
            </View>
            <View>
              <Text style={vs.assignedLabel}>Kullandığım Araç</Text>
              <Text style={vs.plateText}>{driverVehicle.plateNumber}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[vs.leaveBtn, leaveLoading && { opacity: 0.5 }]}
            onPress={() => handleLeaveVehicle(driverVehicle.id)}
            disabled={leaveLoading}
          >
            {leaveLoading
              ? <ActivityIndicator size="small" color="#c62828" />
              : <Text style={vs.leaveBtnText}>Araçtan Ayrıl</Text>}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={vs.noVehicleCard}>
        <View style={vs.noVehicleLeft}>
          <Text style={vs.warnEmoji}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={vs.noVehicleTitle}>Araç Atanmadı</Text>
            <Text style={vs.noVehicleDesc}>Sefer kaydedilebilmesi için araç atamanız gerekir.</Text>
          </View>
        </View>
        <TouchableOpacity style={vs.addVehicleBtn} onPress={() => setAddVehicleVisible(true)}>
          <Text style={vs.addVehicleBtnText}>+ Araç Ekle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /* ─── ARAÇ EKLEME MODAL ─── */
  const renderAddVehicleModal = () => (
    <Modal
      visible={addVehicleVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setAddVehicleVisible(false)}
    >
      <SafeAreaView style={avm.container} edges={['top']}>
        <View style={avm.header}>
          <Text style={avm.title}>Kullandığım Aracı Ekle</Text>
          <TouchableOpacity onPress={() => setAddVehicleVisible(false)}>
            <Text style={avm.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={avm.body}>
          <Text style={avm.info}>
            Kullandığınız aracın plaka numarasını girin. Plaka sistemde kayıtlı değilse yeni araç oluşturulur ve size atanır.
          </Text>
          <Text style={avm.inputLabel}>Plaka No</Text>
          <TextInput
            style={avm.input}
            value={addVehiclePlate}
            onChangeText={v => setAddVehiclePlate(v.toUpperCase())}
            placeholder="Örn: 34ABC123"
            placeholderTextColor="#aaa"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[avm.saveBtn, addVehicleLoading && { opacity: 0.6 }]}
            onPress={handleAddVehicle}
            disabled={addVehicleLoading}
          >
            {addVehicleLoading
              ? <ActivityIndicator color="#222" />
              : <Text style={avm.saveBtnText}>Aracı Ekle</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  /* ─── CARD ─── */
  const renderItem = ({ item }: { item: HaulApi }) => {
    const logoUrl = buildUrl(item.companyLogoPath);
    const paymentLabel = PAYMENT_LABELS[item.paymentType] ?? 'Nakit';

    return (
      <View style={styles.card}>
        <View style={[styles.cardStripe, item.isPaid ? styles.stripeGreen : styles.stripeYellow]} />

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <View style={styles.logoWrap}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImg} />
              ) : (
                <Text style={styles.logoEmoji}>🏢</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.companyName || item.jobSiteName || '—'}
              </Text>
              <Text style={styles.jobSiteName} numberOfLines={1}>
                {item.jobSiteName}
              </Text>
            </View>
            <View style={[styles.statusBadge, item.isPaid ? styles.badgeGreen : styles.badgeYellow]}>
              <Text style={[styles.statusText, item.isPaid ? styles.statusTextGreen : styles.statusTextYellow]}>
                {item.isPaid ? '✓ Ödendi' : '⏳ Bekliyor'}
              </Text>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tarih</Text>
              <Text style={styles.detailValue}>{fmtDate(item.timeOfHaul)} {fmtTime(item.timeOfHaul)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Plaka</Text>
              <Text style={styles.detailValue}>{item.plateNumber}</Text>
            </View>
            {!!item.dumpLocation && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Döküm</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.dumpLocation}</Text>
              </View>
            )}
            {item.tonage > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tonaj</Text>
                <Text style={styles.detailValue}>{item.tonage} ton</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentType}>{paymentLabel}</Text>
              {item.cashAmount > 0 && (
                <Text style={styles.paymentAmount}>💰 {fmtMoney(item.cashAmount)}</Text>
              )}
              {item.fuelAmount > 0 && (
                <Text style={styles.paymentAmount}>⛽ {item.fuelAmount} lt</Text>
              )}
              {item.serialNumber ? (
                <Text style={styles.serialNo}>#{item.serialNumber}</Text>
              ) : null}
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.receiptBtn} onPress={() => setReceiptItem(item)}>
                <Text style={styles.receiptBtnText}>📄 Fiş</Text>
              </TouchableOpacity>
              {!item.isPaid && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item)}
                  disabled={approvingId === item.id}
                >
                  {approvingId === item.id
                    ? <ActivityIndicator size="small" color="#000" />
                    : <Text style={styles.approveBtnText}>✓ Onayla</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  /* ─── RECEIPT MODAL ─── */
  const renderReceipt = () => {
    const item = receiptItem;
    if (!item) return null;
    const logoUrl = buildUrl(item.companyLogoPath);

    return (
      <Modal visible={!!receiptItem} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={rm.container} edges={['top']}>
          <View style={rm.header}>
            <View style={rm.headerLeft}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={rm.headerLogo} />
              ) : (
                <View style={rm.headerLogoFallback}>
                  <Text style={{ fontSize: 22 }}>🏢</Text>
                </View>
              )}
              <View>
                <Text style={rm.headerCompany} numberOfLines={1}>{item.companyName || '—'}</Text>
                <Text style={rm.headerSite} numberOfLines={1}>{item.jobSiteName}</Text>
              </View>
            </View>
            <Text style={rm.headerTime}>{fmtTime(item.timeOfHaul)}</Text>
          </View>

          <ScrollView style={rm.body} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={rm.section}>
              <View style={rm.row}><Text style={rm.label}>Tarih</Text><Text style={rm.value}>{fmtDate(item.timeOfHaul)}</Text></View>
              {item.serialNumber ? (
                <View style={rm.row}><Text style={rm.label}>Seri No</Text><Text style={rm.value}>#{item.serialNumber}</Text></View>
              ) : null}
              <View style={rm.row}><Text style={rm.label}>Plaka</Text><Text style={rm.value}>{item.plateNumber}</Text></View>
              {!!item.dumpLocation && (
                <View style={rm.row}><Text style={rm.label}>Döküm</Text><Text style={rm.value}>{item.dumpLocation}</Text></View>
              )}
              {item.tonage > 0 && (
                <View style={rm.row}><Text style={rm.label}>Tonaj</Text><Text style={rm.value}>{item.tonage} ton</Text></View>
              )}
              {item.cashAmount > 0 && (
                <View style={rm.row}><Text style={rm.label}>Nakit Ücret</Text><Text style={rm.value}>{fmtMoney(item.cashAmount)}</Text></View>
              )}
              {item.fuelAmount > 0 && (
                <View style={rm.row}><Text style={rm.label}>Yakıt</Text><Text style={rm.value}>{item.fuelAmount} lt</Text></View>
              )}
              <View style={rm.row}>
                <Text style={rm.label}>Ödeme Tipi</Text>
                <Text style={rm.value}>{PAYMENT_LABELS[item.paymentType] ?? '—'}</Text>
              </View>
              <View style={rm.row}>
                <Text style={rm.label}>Durum</Text>
                <Text style={[rm.value, item.isPaid ? rm.paid : rm.pending]}>
                  {item.isPaid ? '✓ Ödendi' : '⏳ Bekliyor'}
                </Text>
              </View>
              {!!item.contactPhone && (
                <View style={rm.row}><Text style={rm.label}>Yetkili Tel</Text><Text style={rm.value}>{item.contactPhone}</Text></View>
              )}
              {!!item.driverName && (
                <View style={rm.row}><Text style={rm.label}>Şoför</Text><Text style={rm.value}>{item.driverName}</Text></View>
              )}
              {!!item.note && (
                <View style={rm.row}><Text style={rm.label}>Not</Text><Text style={rm.value}>{item.note}</Text></View>
              )}
            </View>

            {!!item.qrCodeBase64 && (
              <View style={rm.qrSection}>
                <Image
                  source={{ uri: `data:image/png;base64,${item.qrCodeBase64}` }}
                  style={rm.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {!item.isPaid && (
              <TouchableOpacity
                style={rm.approveBtn}
                onPress={() => handleApprove(item)}
                disabled={approvingId === item.id}
              >
                {approvingId === item.id
                  ? <ActivityIndicator color="#000" />
                  : <Text style={rm.approveBtnText}>✓ Ödemeyi Onayla</Text>}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={rm.closeBtn} onPress={() => setReceiptItem(null)}>
              <Text style={rm.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Başlık */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>SEFERLERİM</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && { opacity: 0.5 }]}
          onPress={() => { fetchVehicle(); fetchData(filter); }}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#333" /> : <Text style={styles.refreshIcon}>↻</Text>}
        </TouchableOpacity>
      </View>

      {/* Araç Durumu */}
      <View style={styles.vehicleSection}>
        {renderVehicleBanner()}
      </View>

      {/* Filtre tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* İstatistik çubuğu */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2E7D32' }]}>{paid}</Text>
          <Text style={styles.statLabel}>Ödendi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#E65100' }]}>{pending}</Text>
          <Text style={styles.statLabel}>Bekliyor</Text>
        </View>
      </View>

      {/* Liste */}
      {loading && hauls.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={YELLOW} />
        </View>
      ) : (
        <FlatList
          data={hauls}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => { fetchVehicle(); fetchData(filter); }}
              tintColor={YELLOW}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bu dönemde sefer kaydı bulunamadı.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {renderReceipt()}
      {renderAddVehicleModal()}
    </SafeAreaView>
  );
}

/* ─────────── ANA STİLLER ─────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#222' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { fontSize: 20, fontWeight: '700', color: '#333' },

  vehicleSection: { paddingHorizontal: 16, marginBottom: 8 },

  filterBar: { maxHeight: 48, marginBottom: 4 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd',
  },
  filterTabActive: { backgroundColor: YELLOW, borderColor: YELLOW },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterTabTextActive: { color: '#222' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#222' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#888', fontSize: 14 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardStripe: { width: 5 },
  stripeGreen: { backgroundColor: '#2E7D32' },
  stripeYellow: { backgroundColor: YELLOW },
  cardBody: { flex: 1, padding: 12 },

  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  logoWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logoImg: { width: 40, height: 40, borderRadius: 20 },
  logoEmoji: { fontSize: 20 },
  companyName: { fontSize: 14, fontWeight: '700', color: '#222' },
  jobSiteName: { fontSize: 12, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeGreen: { backgroundColor: '#E8F5E9' },
  badgeYellow: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextGreen: { color: '#2E7D32' },
  statusTextYellow: { color: '#E65100' },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  detailItem: { minWidth: '45%' },
  detailLabel: { fontSize: 10, color: '#999', marginBottom: 1 },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#333' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8,
  },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  paymentType: { fontSize: 11, color: '#888', fontWeight: '500' },
  paymentAmount: { fontSize: 13, fontWeight: '700', color: '#222' },
  serialNo: { fontSize: 11, color: '#aaa' },

  cardActions: { flexDirection: 'row', gap: 6 },
  receiptBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: '#F4F4F4',
    borderWidth: 1, borderColor: '#ddd',
  },
  receiptBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  approveBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: YELLOW,
    minWidth: 70, alignItems: 'center',
  },
  approveBtnText: { fontSize: 12, fontWeight: '700', color: '#222' },
});

/* ─────────── ARAÇ BANNER STİLLERİ ─────────── */
const vs = StyleSheet.create({
  loadingWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  loadingText: { fontSize: 13, color: '#888' },

  assignedCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  assignedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  carIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  carEmoji: { fontSize: 20 },
  assignedLabel: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  plateText: { fontSize: 16, fontWeight: '800', color: '#1B5E20', letterSpacing: 1 },

  leaveBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: '#FFEBEE',
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  leaveBtnText: { fontSize: 12, fontWeight: '700', color: '#c62828' },

  noVehicleCard: {
    backgroundColor: '#FFFDE7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FFF176',
  },
  noVehicleLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  warnEmoji: { fontSize: 20, marginTop: 1 },
  noVehicleTitle: { fontSize: 13, fontWeight: '700', color: '#333' },
  noVehicleDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  addVehicleBtn: {
    backgroundColor: YELLOW, borderRadius: 8, paddingVertical: 10,
    alignItems: 'center',
  },
  addVehicleBtnText: { fontSize: 14, fontWeight: '700', color: '#222' },
});

/* ─────────── ARAÇ EKLEME MODAL STİLLERİ ─────────── */
const avm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 17, fontWeight: '800', color: '#222' },
  closeIcon: { fontSize: 18, color: '#888', padding: 4 },
  body: { padding: 20 },
  info: {
    fontSize: 13, color: '#666', lineHeight: 20,
    backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#eee',
  },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '700', color: '#222', letterSpacing: 2,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: YELLOW, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#222' },
});

/* ─────────── FİŞ MODAL STİLLERİ ─────────── */
const rm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: YELLOW, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerLogo: { width: 44, height: 44, borderRadius: 22 },
  headerLogoFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  headerCompany: { fontSize: 15, fontWeight: '800', color: '#222' },
  headerSite: { fontSize: 12, color: '#444' },
  headerTime: { fontSize: 14, fontWeight: '600', color: '#333' },

  body: { flex: 1 },
  section: {
    margin: 16, backgroundColor: '#FAFAFA',
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#eee',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 13, color: '#888', flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: '#222', flex: 2, textAlign: 'right' },
  paid: { color: '#2E7D32' },
  pending: { color: '#E65100' },

  qrSection: { alignItems: 'center', marginBottom: 16 },
  qrImage: { width: 140, height: 140 },

  approveBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: YELLOW, paddingVertical: 15,
    borderRadius: 12, alignItems: 'center',
  },
  approveBtnText: { fontSize: 16, fontWeight: '700', color: '#222' },

  closeBtn: {
    marginHorizontal: 16,
    backgroundColor: '#F0F0F0', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#555' },
});
