import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../hooks';
import { deleteVehicle, getVehicles, updateVehicle, createVehicle, assignDriver, getVehicleDriver, removeDriver } from '../../services/vehicleService';
import { getHauls, updateHaulPayment, HaulApi } from '../../services/haulService';

const YELLOW = '#FFD500';
const GRAY = '#F4F4F4';
const DARK = '#222';

/* ================= DATA ================= */
type VehicleApi = {
  id: string;
  plateNumber: string;
  canEdit: boolean;
  canDelete: boolean;
  createdDate: string;
  companyName?: string;
};
type VehicleUI = {
  id: string;
  plate: string;
  canEdit: boolean;
  canDelete: boolean;
  createdDate: string;
  companyName?: string;
};


// Sabit trips kaldırıldı — gerçek API verisi kullanılıyor

/* ================= SCREEN ================= */

export default function SupplierVehicles() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trips'>('vehicles');

  const [vehicleModal, setVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [sections, setSections] = useState<{ title: string; data: VehicleUI[][] }[]>([]);
  const [vehicles, setVehicles] = useState<VehicleUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [initialPlate, setInitialPlate] = useState('');
  const [saving, setSaving] = useState(false);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');

  const [driver, setDriver] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null); // null olursa şoför yok

  const [driverRemoved, setDriverRemoved] = useState(false);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<HaulApi | null>(null);

  // Seferler (Hauls)
  const [hauls, setHauls] = useState<HaulApi[]>([]);
  const [haulsLoading, setHaulsLoading] = useState(false);
  const [haulsRefreshing, setHaulsRefreshing] = useState(false);
  const [haulsError, setHaulsError] = useState<string | null>(null);
  const [confirmPaymentModal, setConfirmPaymentModal] = useState(false);
  const [paymentHaul, setPaymentHaul] = useState<HaulApi | null>(null);
  const [paymentType, setPaymentType] = useState<0 | 1>(0); // 0=Nakit, 1=Yakıt
  const [paymentCash, setPaymentCash] = useState('');
  const [paymentFuel, setPaymentFuel] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [haulFilter, setHaulFilter] = useState('');

  const token = useAppSelector(state => state.auth.token);
  const user = useAppSelector(state => state.auth.user);
  const companyId = useAppSelector(state => state.auth.companyId) || user?.companyId;

  const handleCreateVehicle = async () => {
    if (!token || !companyId) {
      Alert.alert("Hata", "Firma bilgisi eksik. Lütfen tekrar giriş yapın.");
      return;
    }

    // Basit validasyon
    if (!newPlate) {
      Alert.alert("Eksik Bilgi", "Lütfen plaka giriniz.");
      return;
    }

    // Şoför telefonu girildiyse format kontrolü (opsiyonel ama iyi olur)
    // newDriverPhone '0555 555 55 55' gibi gelebilir, formatPhone ile boşluklu oluyor.
    // Servis "05392152832" gibi bekliyor mu yoksa boşluklu mu?
    // User örneği: "05392152832". Formatlı stringi temizlemek lazım.
    const cleanPhone = newDriverPhone.replace(/\D/g, '');
    // Ancak sadece numara girildiyse ve assign-driver servisi çağrılacaksa.
    // newDriverPhone boş değilse çağır.

    try {
      setSaving(true);

      const plateForApi = normalizedPlate(newPlate);
      console.log('🚀 Creating Vehicle:', plateForApi);

      // 1. Araç Oluştur
      const res = await createVehicle(plateForApi, companyId, token);

      // Response ID kontrolü
      // User text/plain dedi, belki ID string olarak döner.
      // Eger res bir obje ise ve id property'si varsa onu al.
      // Yoksa res kendisi ID olabilir.
      let newVehicleId = '';
      if (typeof res === 'object' && res?.id) {
        newVehicleId = res.id;
      } else if (typeof res === 'string') {
        newVehicleId = res;
      } else if (res?.data?.id) {
        newVehicleId = res.data.id;
      }

      console.log('✨ Created ID:', newVehicleId);

      // 2. Şoför Ata (Eğer numara varsa)
      if (cleanPhone && cleanPhone.length >= 10 && newVehicleId) {
        try {
          await assignDriver(newVehicleId, cleanPhone, token);
          console.log('✨ Driver Assigned');
          Alert.alert("Başarılı", "Araç ve şoför başarıyla eklendi.");
        } catch (driverError: any) {
          console.log('⚠️ Driver assign failed:', driverError);
          const driverErrorMsg = driverError.response?.data?.message || "Araç eklendi fakat şoför atanamadı.";
          Alert.alert("Uyarı", `Araç oluşturuldu ancak: ${driverErrorMsg}`);
        }
      } else {
        Alert.alert("Başarılı", "Araç başarıyla eklendi.");
      }

      // 3. Temizlik ve Refresh (Her durumda)
      setAddVehicleModal(false);
      setNewPlate('');
      setNewDriverPhone('');
      fetchVehicles();

    } catch (error: any) {
      console.log('Vehicle create failed:', error);
      const errorMsg = error.response?.data?.message || "Araç eklenirken bir sorun oluştu.";
      Alert.alert("Hata", errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDriver = async () => {
    if (!token || !selectedVehicle?.id || !driver?.id) return;

    try {
      setSaving(true);
      await removeDriver(selectedVehicle.id, driver.id, token);

      setDriver(null);
      setDriverRemoved(true);
      setNewDriverPhone('');
      Keyboard.dismiss();

      Alert.alert("Başarılı", "Şoför başarıyla kaldırıldı.");

    } catch (error: any) {
      console.log('Remove driver error:', error);
      Alert.alert("Hata", "Şoför kaldırılırken bir sorun oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!token || !selectedVehicle?.id || !newDriverPhone) return;

    // Sadece rakamları al
    const cleanPhone = newDriverPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert("Hata", "Geçerli bir telefon numarası giriniz.");
      return;
    }

    try {
      setSaving(true);
      console.log('👤 Assigning Driver:', selectedVehicle.id, cleanPhone);

      await assignDriver(selectedVehicle.id, cleanPhone, token);

      Alert.alert("Başarılı", "Şoför ataması yapıldı.");

      // Modal kapat ve yenile
      setVehicleModal(false);
      setSelectedVehicle(null);
      setNewDriverPhone('');
      fetchVehicles();

    } catch (error: any) {
      console.log('Assign Driver error:', error);
      const errorMsg = error.response?.data?.message || "Şoför atanırken bir sorun oluştu.";
      Alert.alert("Hata", errorMsg);
    } finally {
      setSaving(false);
    }
  };

  /* ================= ACTIONS ================= */
  const formatDateDMY = (isoDate: string) => {
    if (!isoDate) return '-';

    const date = new Date(isoDate);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const formatPhone = (value: string) => {
    // sadece rakamları al
    const digits = value.replace(/\D/g, '').slice(0, 11);

    // 0XXX XXX XX XX
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 7);
    const part3 = digits.slice(7, 9);
    const part4 = digits.slice(9, 11);

    let formatted = part1;

    if (part2) formatted += ` ${part2}`;
    if (part3) formatted += ` ${part3}`;
    if (part4) formatted += ` ${part4}`;



    return formatted;
  };

  const mapVehicleFromApi = (item: VehicleApi): VehicleUI => ({
    id: item.id,
    plate: item.plateNumber.replace(
      /^(\d{2})([A-Z]+)(\d+)$/,
      '$1 $2 $3'
    ), // 11ASD1234 → 11 ASD 1234
    canEdit: item.canEdit,
    canDelete: item.canDelete,
    createdDate: item.createdDate,
    companyName: item.companyName,
  });
  const normalizedPlate = (value: string) =>
    value.replace(/\s/g, '').toUpperCase();

  const isPlateChanged =
    normalizedPlate(plate) !== normalizedPlate(initialPlate);

  const handleDeleteVehicle = async () => {
    if (!token || !selectedVehicle?.id) return;

    try {
      setDeleting(true);
      console.log('🗑 handleDeleteVehicle:', selectedVehicle.id);

      await deleteVehicle(selectedVehicle.id, token);

      // modal & confirm kapat
      setDeleteConfirm(false);
      setVehicleModal(false);
      setSelectedVehicle(null);

      // listeyi yenile
      await fetchVehicles();

      console.log('✅ Araç silindi ve liste güncellendi');
    } catch (err) {
      console.log('❌ handleDeleteVehicle error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdatePlate = async () => {
    if (!token || !selectedVehicle?.id) return;

    try {
      setSaving(true);

      const plateForApi = normalizedPlate(plate);

      console.log('✏️ Güncellenecek plaka:', plateForApi);

      await updateVehicle(
        selectedVehicle.id,
        plateForApi,
        selectedVehicle.companyId,
        token
      );

      // modal kapat
      setVehicleModal(false);
      setSelectedVehicle(null);

      // listeyi yenile
      await fetchVehicles();

      console.log('✅ Plaka güncellendi');
    } catch (e) {
      console.log('❌ handleUpdatePlate error:', e);
    } finally {
      setSaving(false);
    }
  };



  const openVehicleDetail = async (item: any) => {
    setSelectedVehicle(item);
    setPlate(item.plate);
    setDriverRemoved(false);
    setVehicleModal(true);
    setDriver(null); // Önce boşalt, yükleniyor durumu için

    if (!token) return;

    try {
      const driverData = await getVehicleDriver(item.id, token);
      if (driverData) {
        // API: { id, userId, phoneNumber, displayName, firstName, lastName }
        const displayName =
          driverData.displayName ||
          [driverData.firstName, driverData.lastName].filter(Boolean).join(' ') ||
          driverData.phoneNumber;

        setDriver({
          id: driverData.id || driverData.userId || '',
          name: displayName,
          phone: driverData.phoneNumber,
        });
      } else {
        setDriver(null);
      }
    } catch (err) {
      console.log('Driver fetch error:', err);
      // Hata olsa da driver null kalır, manuel ekleme yapılabilir
      setDriver(null);
    }
  };


  const confirmDeleteWithAlert = () => {
    Alert.alert(
      'Aracı Sil',
      'Bu işlem geri alınamaz. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: handleDeleteVehicle,
        },
      ]
    );
  };

  const openReceipt = (item: HaulApi) => {
    setSelectedTrip(item);
    setReceiptVisible(true);
  };

  const openPaymentConfirm = (item: HaulApi) => {
    setPaymentHaul(item);
    setPaymentType(item.paymentType === 1 ? 1 : 0);
    setPaymentCash(item.cashAmount > 0 ? String(item.cashAmount) : '');
    setPaymentFuel(item.fuelAmount > 0 ? String(item.fuelAmount) : '');
    setConfirmPaymentModal(true);
  };

  const formatHaulDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${min}`;
  };

  const paymentLabel = (haul: HaulApi) => {
    if (haul.paymentType === 0) return haul.cashAmount > 0 ? `${haul.cashAmount}₺` : 'Nakit';
    if (haul.paymentType === 1) return haul.fuelAmount > 0 ? `${haul.fuelAmount}Lt` : 'Yakıt';
    if (haul.paymentType === 2) {
      const parts = [];
      if (haul.cashAmount > 0) parts.push(`${haul.cashAmount}₺`);
      if (haul.fuelAmount > 0) parts.push(`${haul.fuelAmount}Lt`);
      return parts.length > 0 ? parts.join('+') : 'Nakit+Yakıt';
    }
    return '-';
  };

  const fetchVehicles = async () => {
    if (!token) return; // ✅ burada null engellenir

    try {
      setLoading(true);
      setError(null);

      const data = await getVehicles(token); // artık TS mutlu
      const mapped = data.map(mapVehicleFromApi);
      setVehicles(mapped);

      // Grouping logic
      const grouped: { [key: string]: VehicleUI[] } = {};

      mapped.forEach((vehicle: VehicleUI) => {
        const key = vehicle.companyName || 'Kendi Araçlarım';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(vehicle);
      });

      const sectionsData = Object.keys(grouped).map(key => {
        const groupItems = grouped[key];
        const chunkedData: VehicleUI[][] = [];
        for (let i = 0; i < groupItems.length; i += 2) {
          chunkedData.push(groupItems.slice(i, i + 2));
        }
        return {
          title: key,
          data: chunkedData
        };
      }).sort((a, b) => {
        if (a.title === 'Kendi Araçlarım') return -1;
        if (b.title === 'Kendi Araçlarım') return 1;
        return a.title.localeCompare(b.title);
      });

      setSections(sectionsData);

    } catch (e) {
      setError('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchHauls = async () => {
    if (!token) return;
    try {
      setHaulsLoading(true);
      setHaulsError(null);
      const data = await getHauls(token);
      const sorted = [...data].sort(
        (a, b) => new Date(b.timeOfHaul).getTime() - new Date(a.timeOfHaul).getTime()
      );
      setHauls(sorted);
    } catch {
      setHaulsError('Seferler yüklenemedi');
    } finally {
      setHaulsLoading(false);
    }
  };

  const onHaulsRefresh = useCallback(async () => {
    if (!token) return;
    setHaulsRefreshing(true);
    try {
      const data = await getHauls(token);
      const sorted = [...data].sort(
        (a, b) => new Date(b.timeOfHaul).getTime() - new Date(a.timeOfHaul).getTime()
      );
      setHauls(sorted);
      setHaulsError(null);
    } catch {
      setHaulsError('Seferler yüklenemedi');
    } finally {
      setHaulsRefreshing(false);
    }
  }, [token]);

  const handleConfirmPayment = async () => {
    if (!token || !paymentHaul) return;
    try {
      setPaymentSaving(true);
      await updateHaulPayment(
        {
          haulId: paymentHaul.id,
          isPaid: true,
          paymentType,
          cashAmount: paymentType === 0 ? parseFloat(paymentCash) || 0 : 0,
          fuelAmount: paymentType === 1 ? parseFloat(paymentFuel) || 0 : 0,
          tonage: paymentHaul.tonage,
          dumpLocation: paymentHaul.dumpLocation,
        },
        token
      );
      setConfirmPaymentModal(false);
      setPaymentHaul(null);
      setPaymentCash('');
      setPaymentFuel('');
      Alert.alert('Başarılı', 'Ödeme onaylandı.');
      fetchHauls();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ödeme onaylanırken hata oluştu.';
      Alert.alert('Hata', msg);
    } finally {
      setPaymentSaving(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchHauls();
  }, [token]);


  /* ================= RENDERS ================= */

  const renderVehicle = ({ item }: { item: VehicleUI[] }) => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {item.map((vehicle) => (
        <TouchableOpacity
          key={vehicle.id}
          style={[styles.vehicleCard, { flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => openVehicleDetail(vehicle)}
        >
          <View style={styles.plateBox}>
            <Text style={styles.plateText}>{vehicle.plate}</Text>
          </View>

          <Text style={styles.vehicleDate}>Kayıt: {formatDateDMY(vehicle.createdDate)}</Text>
        </TouchableOpacity>
      ))}
      {/* If there's only 1 item, add an empty view to fill the space so it aligns left */}
      {item.length === 1 && <View style={{ flex: 1 }} />}
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const autoSerial = (haul: HaulApi) => {
    const d = new Date(haul.createdDate);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yy}${mm}${dd}${hh}${mi}${ss}`;
  };

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  };

  const renderTrip = ({ item }: { item: HaulApi }) => {
    const today = isToday(item.timeOfHaul);
    const paid = item.isPaid;

    return (
      <View style={[
        styles.haulCard,
        paid ? styles.haulCardPaid : styles.haulCardUnpaid,
        today && styles.haulCardToday,
      ]}>
        {/* Üst Satır: Seri No + Bugün Badge */}
        <View style={styles.haulCardTopRow}>
          <View style={styles.serialBox}>
            <Text style={styles.serialAuto}>{autoSerial(item)}</Text>
            {item.serialNumber ? (
              <Text style={styles.serialCustom}>#{item.serialNumber}</Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {today && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayText}>Bugün</Text>
              </View>
            )}
            {paid ? (
              <View style={styles.statusPaid}>
                <Text style={styles.statusPaidText}>✔ Ödendi</Text>
              </View>
            ) : (
              <View style={styles.statusPending}>
                <Text style={styles.statusPendingText}>⏳ Bekliyor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tarih + Plaka */}
        <View style={styles.haulCardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.haulDateText}>{formatHaulDate(item.timeOfHaul)}</Text>
            <Text style={styles.haulPlateText}>{item.plateNumber}</Text>
          </View>
          {/* Tonaj + Ödeme Badge */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {item.tonage > 0 && (
              <Text style={styles.tonageText}>{item.tonage} kg</Text>
            )}
            {item.cashAmount > 0 && (
              <View style={styles.cashBadge}>
                <Text style={styles.cashBadgeText}>{item.cashAmount.toLocaleString('tr-TR')} ₺</Text>
              </View>
            )}
            {item.fuelAmount > 0 && (
              <View style={styles.fuelBadge}>
                <Text style={styles.fuelBadgeText}>{item.fuelAmount.toLocaleString('tr-TR')} Lt</Text>
              </View>
            )}
          </View>
        </View>

        {/* Yükleme → Döküm */}
        <View style={styles.haulCardRow}>
          <Text style={styles.haulSiteLabel} numberOfLines={1}>
            📍 {item.jobSiteName || item.companyName || '-'}
          </Text>
          {item.dumpLocation ? (
            <Text style={styles.haulDumpText} numberOfLines={1}>
              → {item.dumpLocation}
            </Text>
          ) : null}
        </View>

        {/* Not */}
        {item.note ? (
          <Text style={styles.haulNoteText} numberOfLines={1}>💬 {item.note}</Text>
        ) : null}

        {/* Alt Butonlar */}
        <View style={styles.haulCardActions}>
          <TouchableOpacity style={styles.haulFisBtn} onPress={() => openReceipt(item)}>
            <Text style={styles.haulFisBtnText}>👁 Fiş</Text>
          </TouchableOpacity>

          {!paid ? (
            <TouchableOpacity
              style={styles.haulApproveBtn}
              onPress={() => openPaymentConfirm(item)}
            >
              <Text style={styles.haulApproveBtnText}>✔ Onayla</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.haulApprovedTag}>
              <Text style={styles.haulApprovedTagText}>✔ Onaylı</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* HEADER */}
      <Text style={styles.title}>Araç Yönetimi</Text>
      <Text style={styles.subTitle}>Araç listeniz ve yönetim işlemleri</Text>

      {/* TABS */}
      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'vehicles' && styles.tabActive]}
            onPress={() => setActiveTab('vehicles')}
          >
            <Text style={activeTab === 'vehicles' ? styles.tabTextActive : styles.tabText}>
              Araçlar ({vehicles.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'trips' && styles.tabActive]}
            onPress={() => setActiveTab('trips')}
          >
            <Text style={activeTab === 'trips' ? styles.tabTextActive : styles.tabText}>
              Seferler ({hauls.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'trips' ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onHaulsRefresh}
            disabled={haulsRefreshing}
          >
            <Text style={styles.addBtnText}>{haulsRefreshing ? '⏳ Yenileniyor...' : '🔄 Yenile'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddVehicleModal(true)}>
            <Text style={styles.addBtnText}>＋ Yeni Araç Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ================= VEHICLES ================= */}
      {activeTab === 'vehicles' && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item[0].id}
          renderItem={renderVehicle}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 20, gap: 10, paddingHorizontal: 5 }}
          stickySectionHeadersEnabled={false}
          renderSectionFooter={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* ================= TRIPS ================= */}
      {activeTab === 'trips' && (
        <>
          {/* Özet Kartları */}
          <View style={styles.haulSummaryRow}>
            <View style={styles.haulSummaryCard}>
              <Text style={styles.haulSummaryNum}>{hauls.length}</Text>
              <Text style={styles.haulSummaryLabel}>Toplam</Text>
            </View>
            <View style={[styles.haulSummaryCard, { backgroundColor: '#EAF7EA' }]}>
              <Text style={[styles.haulSummaryNum, { color: '#2E7D32' }]}>
                {hauls.filter(h => h.isPaid).length}
              </Text>
              <Text style={styles.haulSummaryLabel}>Ödendi</Text>
            </View>
            <View style={[styles.haulSummaryCard, { backgroundColor: '#FFF4E5' }]}>
              <Text style={[styles.haulSummaryNum, { color: '#E65100' }]}>
                {hauls.filter(h => !h.isPaid).length}
              </Text>
              <Text style={styles.haulSummaryLabel}>Bekliyor</Text>
            </View>
          </View>

          {/* Arama kutusu */}
          {!haulsLoading && !haulsError && hauls.length > 0 && (
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Plaka veya şantiye ara..."
                placeholderTextColor="#aaa"
                value={haulFilter}
                onChangeText={setHaulFilter}
                autoCapitalize="characters"
              />
              {haulFilter.length > 0 && (
                <TouchableOpacity onPress={() => setHaulFilter('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {haulsLoading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Seferler yükleniyor...</Text>
            </View>
          ) : haulsError ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{haulsError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchHauls}>
                <Text style={styles.retryText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : hauls.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={{ fontSize: 40 }}>🚛</Text>
              <Text style={styles.emptyText}>Henüz sefer kaydı yok.</Text>
            </View>
          ) : (
            <FlatList
              data={hauls.filter(h => {
                if (!haulFilter) return true;
                const q = haulFilter.toLowerCase();
                return (
                  h.plateNumber.toLowerCase().includes(q) ||
                  (h.jobSiteName || '').toLowerCase().includes(q) ||
                  (h.dumpLocation || '').toLowerCase().includes(q) ||
                  (h.serialNumber || '').toLowerCase().includes(q)
                );
              })}
              keyExtractor={i => i.id}
              renderItem={renderTrip}
              contentContainerStyle={{ paddingBottom: 20, gap: 10 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={haulsRefreshing}
                  onRefresh={onHaulsRefresh}
                  colors={['#1976D2']}
                  tintColor="#1976D2"
                />
              }
              ListEmptyComponent={
                <View style={styles.centerBox}>
                  <Text style={styles.emptyText}>Arama sonucu bulunamadı.</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {/* ================= VEHICLE DETAIL MODAL ================= */}
      <Modal visible={vehicleModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ alignItems: 'center' }}
              >
                <View style={styles.editCard}>
                  {/* HEADER */}
                  <View style={styles.headerRow}>
                    <Text style={styles.editTitle}>🚚 Araç Düzenle</Text>

                    <Pressable
                      onPress={() => {
                        Keyboard.dismiss();
                        setVehicleModal(false);
                      }}
                    >
                      <Text style={styles.closeX}>✕</Text>
                    </Pressable>
                  </View>

                  {/* SUCCESS */}
                  {driverRemoved && (
                    <View style={styles.successBox}>
                      <Text style={styles.successText}>
                        ✔ Şoför başarıyla kaldırıldı.
                      </Text>
                    </View>
                  )}

                  {/* PLAKA */}
                  <Text style={styles.label}>Plaka Numarası *</Text>
                  <TextInput
                    value={plate}
                    onChangeText={setPlate}
                    style={styles.plateInput}
                    placeholder="Plaka giriniz"
                    autoCapitalize="characters"
                  />

                  {/* ACTIONS */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        !isPlateChanged && { opacity: 0.5 },
                      ]}
                      disabled={!isPlateChanged || saving}
                      onPress={handleUpdatePlate}
                    >
                      <Text style={styles.saveText}>
                        {saving ? 'Kaydediliyor…' : '✔ Kaydet'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmDeleteBtn}
                      onPress={confirmDeleteWithAlert}
                      disabled={deleting}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {deleting ? 'Siliniyor...' : 'Plakayı Sil'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  {/* DRIVER */}
                  <Text style={styles.section}>👤 Şoför Bilgisi</Text>

                  {driver ? (
                    <View style={styles.driverCard}>
                      <View>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <Text style={styles.driverPhone}>{driver.phone}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={handleRemoveDriver}
                      >
                        <Text style={styles.removeText}>Kaldır</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                          ⚠ Bu araca henüz şoför atanmamış. Aşağıdan şoför
                          atayabilirsiniz.
                        </Text>
                      </View>

                      <Text style={styles.label}>Şoför Telefon Numarası *</Text>

                      <View style={styles.assignRow}>
                        <TextInput
                          value={newDriverPhone}
                          onChangeText={text => setNewDriverPhone(formatPhone(text))} //newDriverPhone.replace(/\s/g, '') servise giderken boşlukları siler 
                          style={styles.phoneInput}
                          keyboardType="phone-pad"
                          placeholder="05__ ___ __ __"
                          maxLength={14}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />

                        <TouchableOpacity
                          style={[
                            styles.assignBtn,
                            !newDriverPhone && { opacity: 0.5 },
                          ]}
                          disabled={!newDriverPhone || saving}
                          onPress={handleAssignDriver}
                        >
                          <Text style={styles.assignText}>👤 Şoför Ata</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.helpText}>
                        ℹ Şoför olarak atanacak kişinin telefon numarasını girin.
                      </Text>
                      <Text style={styles.helpText}>
                        💡 Kendiniz kullanacaksanız kendi numaranızı yazın.
                      </Text>
                    </>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>

        {/* DELETE CONFIRM */}
        <Modal visible={deleteConfirm} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.confirmCard}>
              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 10 }}>
                Aracı silmek istiyor musunuz?
              </Text>
              <Text style={{ color: '#666', marginBottom: 20 }}>
                Bu işlem geri alınamaz.
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteConfirm(false)}
                >
                  <Text>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmDeleteBtn}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Modal>





      {/* ================= RECEIPT MODAL ================= */}
      <Modal visible={receiptVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalWrap}>
            {/* Modal Başlık */}
            <View style={styles.receiptModalHeader}>
              <Text style={styles.receiptModalTitle}>🧾 Sefer Fişi</Text>
              <Pressable onPress={() => setReceiptVisible(false)}>
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>

            {selectedTrip && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                {/* FİŞ KARTI — web .haul-receipt stili */}
                <View style={styles.receiptCard}>
                  {/* WATERMARK */}
                  <View style={styles.receiptWatermark} pointerEvents="none">
                    <Text style={styles.receiptWatermarkText}>HAFRİYAT</Text>
                  </View>

                  {/* ÜST BÖLÜM: Saat | Firma+Şantiye | QR */}
                  <View style={styles.receiptTop}>
                    {/* Sol: Saat + Tarih */}
                    <View style={styles.receiptTopLeft}>
                      <Text style={styles.receiptBigTime}>
                        {new Date(selectedTrip.timeOfHaul).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text style={styles.receiptSmallDate}>
                        {new Date(selectedTrip.timeOfHaul).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </Text>
                    </View>

                    {/* Orta: Firma + Şantiye */}
                    <View style={styles.receiptTopCenter}>
                      <Text style={styles.receiptCompanyName} numberOfLines={2}>
                        {(selectedTrip.companyName || 'HAFRİYAT').toUpperCase()}
                      </Text>
                      <Text style={styles.receiptJobsiteName} numberOfLines={1}>
                        {selectedTrip.jobSiteName || '-'}
                      </Text>
                    </View>

                    {/* Sağ: QR */}
                    <View style={styles.receiptTopRight}>
                      {selectedTrip.qrCodeBase64 ? (
                        <Image
                          source={{ uri: `data:image/png;base64,${selectedTrip.qrCodeBase64}` }}
                          style={styles.receiptQR}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.receiptQR, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 28 }}>📋</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* DETAY SATIRLARI */}
                  <View style={styles.receiptDetails}>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Plaka</Text>
                      <Text style={[styles.receiptDetailValue, { fontWeight: '800', letterSpacing: 1 }]}>
                        {selectedTrip.plateNumber}
                      </Text>
                    </View>

                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Şoför</Text>
                      <Text style={styles.receiptDetailValue}>
                        {selectedTrip.driverPhone || selectedTrip.driverName || '-'}
                      </Text>
                    </View>

                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Döküm</Text>
                      <Text style={styles.receiptDetailValue} numberOfLines={2}>
                        {selectedTrip.dumpLocation || '-'}
                      </Text>
                    </View>

                    {selectedTrip.tonage > 0 && (
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Tonaj</Text>
                        <Text style={styles.receiptDetailValue}>
                          {selectedTrip.tonage.toLocaleString('tr-TR')} kg
                        </Text>
                      </View>
                    )}

                    <View style={[styles.receiptDetailRow, styles.receiptDetailRowStrong]}>
                      <Text style={styles.receiptDetailLabel}>Ücret</Text>
                      <Text style={[styles.receiptDetailValue, styles.receiptDetailValueStrong]}>
                        {(() => {
                          const parts: string[] = [];
                          if (selectedTrip.cashAmount > 0)
                            parts.push(`${selectedTrip.cashAmount.toLocaleString('tr-TR')} TL`);
                          if (selectedTrip.fuelAmount > 0)
                            parts.push(`${selectedTrip.fuelAmount.toLocaleString('tr-TR')} Lt`);
                          return parts.length > 0 ? parts.join(' / ') : '-';
                        })()}
                      </Text>
                    </View>

                    {selectedTrip.contactPhone ? (
                      <View style={[styles.receiptDetailRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.receiptDetailLabel}>Yetkili</Text>
                        <Text style={styles.receiptDetailValue}>{selectedTrip.contactPhone}</Text>
                      </View>
                    ) : (
                      <View style={[styles.receiptDetailRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.receiptDetailLabel}>Seri No</Text>
                        <Text style={[styles.receiptDetailValue, { fontFamily: 'monospace' }]}>
                          {autoSerial(selectedTrip)}
                          {selectedTrip.serialNumber ? `  #${selectedTrip.serialNumber}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* DURUM */}
                <View style={[
                  styles.receiptStatusBox,
                  { backgroundColor: selectedTrip.isPaid ? '#E8F5E9' : '#FFFDE7' },
                ]}>
                  <Text style={{
                    fontWeight: '800',
                    color: selectedTrip.isPaid ? '#2E7D32' : '#E65100',
                    fontSize: 14,
                  }}>
                    {selectedTrip.isPaid ? '✔ Ödendi' : '⏳ Ödeme Bekliyor'}
                  </Text>
                </View>

                {!selectedTrip.isPaid && (
                  <TouchableOpacity
                    style={styles.confirmBigBtn}
                    onPress={() => {
                      setReceiptVisible(false);
                      openPaymentConfirm(selectedTrip);
                    }}
                  >
                    <Text style={styles.confirmBigText}>💰 Ödemeyi Onayla</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* Footer */}
            <TouchableOpacity style={styles.receiptCloseBtn} onPress={() => setReceiptVisible(false)}>
              <Text style={styles.receiptCloseBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= ÖDEME ONAY MODAL ================= */}
      <Modal visible={confirmPaymentModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <View style={styles.paymentCard}>
                <View style={styles.headerRow}>
                  <Text style={styles.editTitle}>💰 Ödeme Onayla</Text>
                  <Pressable onPress={() => setConfirmPaymentModal(false)}>
                    <Text style={styles.closeX}>✕</Text>
                  </Pressable>
                </View>

                {paymentHaul && (
                  <View style={styles.paymentInfoBox}>
                    <Text style={styles.paymentInfoPlate}>{paymentHaul.plateNumber}</Text>
                    <Text style={styles.paymentInfoDate}>{formatHaulDate(paymentHaul.timeOfHaul)}</Text>
                    <Text style={styles.paymentInfoSite}>{paymentHaul.jobSiteName}</Text>
                  </View>
                )}

                {/* Ödeme Türü Seçimi */}
                <Text style={styles.label}>Ödeme Türü</Text>
                <View style={styles.payTypeRow}>
                  <TouchableOpacity
                    style={[styles.payTypeBtn, paymentType === 0 && styles.payTypeActive]}
                    onPress={() => setPaymentType(0)}
                  >
                    <Text style={[styles.payTypeText, paymentType === 0 && styles.payTypeTextActive]}>
                      💵 Nakit (₺)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payTypeBtn, paymentType === 1 && styles.payTypeActive]}
                    onPress={() => setPaymentType(1)}
                  >
                    <Text style={[styles.payTypeText, paymentType === 1 && styles.payTypeTextActive]}>
                      ⛽ Yakıt (Lt)
                    </Text>
                  </TouchableOpacity>
                </View>

                {paymentType === 0 ? (
                  <>
                    <Text style={styles.label}>Nakit Tutar (₺)</Text>
                    <TextInput
                      value={paymentCash}
                      onChangeText={setPaymentCash}
                      style={styles.plateInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Yakıt Miktarı (Litre)</Text>
                    <TextInput
                      value={paymentFuel}
                      onChangeText={setPaymentFuel}
                      style={styles.plateInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[styles.saveBigBtn, paymentSaving && { opacity: 0.6 }]}
                  onPress={handleConfirmPayment}
                  disabled={paymentSaving}
                >
                  <Text style={styles.saveBigText}>
                    {paymentSaving ? 'Kaydediliyor...' : '✔ Ödemeyi Onayla'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setConfirmPaymentModal(false)}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* ================= New vehicle MODAL ================= */}
      <Modal visible={addVehicleModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ alignItems: 'center' }}
              >
                <View style={styles.addCard}>
                  {/* HEADER */}
                  <View style={styles.addHeader}>
                    <Text style={styles.addIcon}>🚚</Text>
                    <Text style={styles.addTitle}>Yeni Araç Ekle</Text>
                  </View>

                  {/* PLAKA */}
                  <View style={{ padding: '5%' }}>
                    <Text style={styles.label}>PLAKA NUMARASI *</Text>
                    <TextInput
                      value={newPlate}
                      onChangeText={setNewPlate}
                      style={styles.plateInput}
                      placeholder="34 ABC 123"
                      autoCapitalize="characters"
                    />
                    <Text style={styles.hint}>ℹ Örn: 34 ABC 123</Text>

                    <View style={styles.divider} />

                    {/* DRIVER PHONE */}
                    <Text style={styles.label}>ŞOFÖR TELEFON NUMARASI *</Text>
                    <TextInput
                      value={newDriverPhone}
                      onChangeText={text => setNewDriverPhone(formatPhone(text))}
                      style={styles.phoneInput}
                      keyboardType="phone-pad"
                      placeholder="05__ ___ __ __"
                      maxLength={14} // boşluklar dahil
                    />

                    <Text style={styles.helpText}>
                      ℹ Şoförün telefon numarasını girin.
                    </Text>
                    <Text style={styles.helpText}>
                      💡 Kendiniz kullanacaksanız kendi numaranızı yazın.
                    </Text>

                    {/* SAVE */}
                    <TouchableOpacity
                      style={[
                        styles.saveBigBtn,
                        !(newPlate) && { opacity: 0.5 },
                      ]}
                      disabled={!(newPlate) || saving}
                      onPress={handleCreateVehicle}
                    >
                      <Text style={styles.saveBigText}>✔ Aracı Kaydet</Text>
                    </TouchableOpacity>

                    {/* CANCEL */}
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setAddVehicleModal(false);
                        setNewPlate('');
                        setNewDriverPhone('');
                      }}
                    >
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBEA', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 },

  title: { fontSize: 22, fontWeight: '800', color: DARK },
  subTitle: { fontSize: 13, color: '#777', marginBottom: 12 },

  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
  },

  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  tabActive: { backgroundColor: YELLOW },

  tabText: { color: '#777', fontWeight: '600' },
  tabTextActive: { color: '#222', fontWeight: '700' },

  addBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  addBtnText: { fontWeight: '700' },

  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    width: '48%',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 1.22,

    elevation: 3,
  },

  plateBox: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 8,
  },

  plateText: { fontSize: 16, fontWeight: '800' },
  vehicleInfo: { fontSize: 12, color: '#444' },
  vehicleDate: { fontSize: 11, color: '#999', marginTop: 4 },

  approveBtn: {
    backgroundColor: YELLOW,
    width: 60,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveText: { fontSize: 11, fontWeight: '700' },

  // Arama kutusu
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },

  searchIcon: { fontSize: 14, marginRight: 8 },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: DARK,
  },

  searchClear: {
    fontSize: 14,
    color: '#aaa',
    paddingHorizontal: 4,
  },

  // Haul Card
  haulCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },

  haulCardPaid: {
    backgroundColor: '#fff',
    borderLeftColor: '#4CAF50',
  },

  haulCardUnpaid: {
    backgroundColor: '#FFFDE7',
    borderLeftColor: '#FFC107',
  },

  haulCardToday: {
    borderLeftColor: '#1565C0',
  },

  haulCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  serialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  serialAuto: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#555',
    fontWeight: '600',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  serialCustom: {
    fontSize: 11,
    color: '#1565C0',
    fontWeight: '700',
  },

  todayBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  todayText: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '700',
  },

  statusPaid: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  statusPaidText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
  },

  statusPending: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFC107',
  },

  statusPendingText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '700',
  },

  haulCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  haulDateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },

  haulPlateText: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 1,
  },

  tonageText: {
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },

  cashBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },

  cashBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },

  fuelBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },

  fuelBadgeText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '700',
  },

  haulSiteLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
    flex: 1,
  },

  haulDumpText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
    textAlign: 'right',
  },

  haulNoteText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 6,
  },

  haulCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  haulFisBtn: {
    borderWidth: 1.5,
    borderColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  haulFisBtnText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: '700',
  },

  haulApproveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },

  haulApproveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  haulApprovedTag: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  haulApprovedTagText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },

  detailPlate: { fontSize: 18, fontWeight: '800', marginBottom: 10 },

  closeText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#555',
  },
  editCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },

  editHeader: {
    marginBottom: 14,
  },

  editTitle: {
    fontSize: 20,
    fontWeight: '800',
  },

  label: {
    marginTop: 10,
    fontWeight: '600',
    color: '#666',
  },

  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },

  inputText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },

  saveBtn: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 10,
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
  },

  backBtn: {
    backgroundColor: '#777',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  backText: {
    color: '#fff',
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },

  section: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  driverCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  driverName: {
    fontWeight: '700',
    fontSize: 15,
  },

  driverPhone: {
    color: '#F5A623',
    marginTop: 4,
  },

  removeBtn: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  removeText: {
    color: '#FF3B30',
    fontWeight: '700',
  },

  successBox: {
    backgroundColor: '#EAF7EA',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  successText: {
    color: '#2E7D32',
    fontWeight: '600',
  },

  warningBox: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FF9800',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  warningText: {
    color: '#E65100',
    fontWeight: '600',
  },

  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginRight: 10,
    fontSize: 15,
  },

  assignBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  assignText: {
    color: '#fff',
    fontWeight: '700',
  },

  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  plateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  closeX: {
    fontSize: 22,
    fontWeight: '700',
    color: '#555',
  },

  deleteBtn: {
    backgroundColor: '#FFEAEA',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  deleteText: {
    color: '#FF3B30',
    fontWeight: '700',
  },

  confirmCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },

  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#eee',
  },

  confirmDeleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
  },
  addCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },

  addHeader: {
    backgroundColor: '#F5A623',
    paddingVertical: 26,
    alignItems: 'center',
  },

  addIcon: {
    fontSize: 36,
    color: '#fff',
    marginBottom: 6,
  },

  addTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },

  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },

  saveBigBtn: {
    backgroundColor: '#0A66FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
  },

  saveBigText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  cancelText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#999',
    fontSize: 14,
  },

  sectionHeader: {
    backgroundColor: '#FFFBEA',
    paddingVertical: 10,
    marginTop: 10,
  },

  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  // Haul / Trips stiller
  haulSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  haulSummaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  haulSummaryNum: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },

  haulSummaryLabel: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    color: '#777',
    fontSize: 14,
  },

  errorText: {
    color: '#E65100',
    fontSize: 14,
    marginBottom: 12,
  },

  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10,
  },

  retryBtn: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },

  retryText: {
    fontWeight: '700',
  },

  paidBadge: {
    backgroundColor: '#EAF7EA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  paidText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },

  // Receipt Modal wrap
  receiptModalWrap: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
  },

  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  receiptModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
  },

  // Fiş kartı — .haul-receipt
  receiptCard: {
    borderWidth: 2,
    borderColor: DARK,
    borderRadius: 18,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 12,
  },

  receiptWatermark: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },

  receiptWatermarkText: {
    fontSize: 52,
    fontWeight: '800',
    color: DARK,
    opacity: 0.06,
    letterSpacing: 2,
    transform: [{ rotate: '-28deg' }],
  },

  // Üst bölüm — .haul-receipt__top
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    zIndex: 1,
    marginBottom: 10,
  },

  receiptTopLeft: {
    minWidth: 62,
  },

  receiptBigTime: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    lineHeight: 26,
  },

  receiptSmallDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },

  receiptTopCenter: {
    flex: 1,
    minWidth: 0,
  },

  receiptCompanyName: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
    textTransform: 'uppercase',
  },

  receiptJobsiteName: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
    marginTop: 2,
  },

  receiptTopRight: {
    alignItems: 'flex-end',
  },

  receiptQR: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 3,
  },

  // Detay satırları — .haul-receipt__details
  receiptDetails: {
    zIndex: 1,
  },

  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderStyle: 'dashed',
  },

  receiptDetailRowStrong: {
    borderBottomColor: 'rgba(0,0,0,0.18)',
  },

  receiptDetailLabel: {
    fontSize: 12,
    color: '#888',
    minWidth: 52,
  },

  receiptDetailValue: {
    fontSize: 12,
    color: DARK,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  receiptDetailValueStrong: {
    fontSize: 14,
    fontWeight: '800',
  },

  receiptStatusBox: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },

  confirmBigBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 6,
  },

  confirmBigText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  receiptCloseBtn: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },

  receiptCloseBtnText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 14,
  },

  // Payment Modal
  paymentCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    alignSelf: 'center',
  },

  paymentInfoBox: {
    backgroundColor: GRAY,
    borderRadius: 12,
    padding: 14,
    marginVertical: 14,
  },

  paymentInfoPlate: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },

  paymentInfoDate: {
    fontSize: 12,
    color: '#888',
  },

  paymentInfoSite: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
    fontWeight: '600',
  },

  payTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },

  payTypeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  payTypeActive: {
    borderColor: YELLOW,
    backgroundColor: '#FFFBEA',
  },

  payTypeText: {
    fontWeight: '600',
    color: '#888',
  },

  payTypeTextActive: {
    color: DARK,
    fontWeight: '800',
  },
});
