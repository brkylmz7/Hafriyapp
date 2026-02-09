import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../hooks';
import { deleteVehicle, getVehicles, updateVehicle, createVehicle, assignDriver, getVehicleDriver, removeDriver } from '../../services/vehicleService';

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
};
type VehicleUI = {
  id: string;
  plate: string;
  canEdit: boolean;
  canDelete: boolean;
  createdDate: string;
};


const trips = [
  {
    id: '326',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'ÇEKİÇ',
    price: '45₺',
    approved: false,
  },
  {
    id: '327',
    date: '06.12.2025',
    plate: '34 ABD 361',
    company: 'KAYA',
    price: '2500₺',
    approved: true,
  },
];

/* ================= SCREEN ================= */

export default function SupplierVehicles() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trips'>('vehicles');

  const [vehicleModal, setVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [initialPlate, setInitialPlate] = useState('');
  const [saving, setSaving] = useState(false);
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');

  const [driver, setDriver] = useState<any>({
    name: 'Burak Yılmaz',
    phone: '+905555555555',
  }); // null olursa şoför yok

  const [driverRemoved, setDriverRemoved] = useState(false);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
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
    if (!token || !selectedVehicle?.id) return;

    try {
      setSaving(true);
      await removeDriver(selectedVehicle.id, token);

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
        setDriver({
          name: driverData.displayName || driverData.phoneNumber,
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

  const openReceipt = (item: any) => {
    setSelectedTrip(item);
    setReceiptVisible(true);
  };
  const fetchVehicles = async () => {
    if (!token) return; // ✅ burada null engellenir

    try {
      setLoading(true);
      setError(null);

      const data = await getVehicles(token); // artık TS mutlu
      const mapped = data.map(mapVehicleFromApi);
      setVehicles(mapped);
    } catch (e) {
      setError('Araçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [token]);


  /* ================= RENDERS ================= */

  const renderVehicle = ({ item }: any) => (
    <TouchableOpacity
      style={styles.vehicleCard}
      activeOpacity={0.85}
      onPress={() => openVehicleDetail(item)}
    >
      <View style={styles.plateBox}>
        <Text style={styles.plateText}>{item.plate}</Text>
      </View>

      {/* <Text style={styles.vehicleInfo}>Harcanan Yakıt: {item.fuel}</Text>
      <Text style={styles.vehicleInfo}>Toplanan Para: {item.cash}</Text> */}
      <Text style={styles.vehicleDate}>Kayıt: {formatDateDMY(item.createdDate)}</Text>
    </TouchableOpacity>
  );

  const renderTrip = ({ item }: any) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { width: 50 }]}>…{item.id}</Text>
      <Text style={[styles.cell, { width: 90 }]}>{item.date}</Text>
      <Text style={[styles.cell, { width: 95 }]}>{item.plate}</Text>
      <Text style={[styles.cell, { width: 80 }]} numberOfLines={1}>
        {item.company}
      </Text>
      <Text style={[styles.cell, { width: 70 }]}>{item.price}</Text>

      <TouchableOpacity
        style={[styles.cellCenter, { width: 40 }]}
        onPress={() => openReceipt(item)}
      >
        <Text>📄</Text>
      </TouchableOpacity>

      <View style={{ width: 70, alignItems: 'center' }}>
        {item.approved ? (
          <Text style={{ fontSize: 16 }}>✔</Text>
        ) : (
          <TouchableOpacity style={styles.approveBtn}>
            <Text style={styles.approveText}>Onayla</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
              Seferler ({trips.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddVehicleModal(true)}>
          <Text style={styles.addBtnText}>＋ Yeni Araç Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* ================= VEHICLES ================= */}
      {activeTab === 'vehicles' && (
        <FlatList
          data={vehicles}
          keyExtractor={i => i.id}
          renderItem={renderVehicle}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingVertical: 12, gap: 10, padding: 5 }}
        />
      )}

      {/* ================= TRIPS ================= */}
      {activeTab === 'trips' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: 520 }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.hCell, { width: 50 }]}>Seri</Text>
              <Text style={[styles.hCell, { width: 90 }]}>Tarih</Text>
              <Text style={[styles.hCell, { width: 95 }]}>Plaka</Text>
              <Text style={[styles.hCell, { width: 80 }]}>Firma</Text>
              <Text style={[styles.hCell, { width: 70 }]}>Ödeme</Text>
              <Text style={[styles.hCell, { width: 40 }]}>Fiş</Text>
              <Text style={[styles.hCell, { width: 70 }]}>Onay</Text>
            </View>

            <FlatList data={trips} keyExtractor={i => i.id} renderItem={renderTrip} />
          </View>
        </ScrollView>
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
      <Modal visible={receiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <Text style={styles.detailPlate}>Sefer Fişi</Text>
            <Text>Plaka: {selectedTrip?.plate}</Text>
            <Text>Tutar: {selectedTrip?.price}</Text>

            <TouchableOpacity onPress={() => setReceiptVisible(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  container: { flex: 1, backgroundColor: '#FFFBEA', padding: 16 },

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

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 6,
  },

  hCell: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  cell: { fontSize: 11, textAlign: 'center' },
  cellCenter: { alignItems: 'center', justifyContent: 'center' },

  approveBtn: {
    backgroundColor: YELLOW,
    width: 60,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveText: { fontSize: 11, fontWeight: '700' },

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

});
