import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, Pressable, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { getJobHauls } from '../../services/jobSiteNewService';
import { createHaul, HaulApi } from '../../services/haulService';
import {
  addPendingHaul,
  removePendingHaul,
  PendingHaul,
} from '../../store/slices/pendingHaulSlice';

const YELLOW = '#FFD500';
const DARK = '#222';

// İnterneti test et (netinfo paketi olmadan)
const checkOnline = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch('https://api.hafriyapp.com/api/user/profile', {
      method: 'HEAD',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

export default function JobDetails() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { job } = route.params || {};
  const dispatch = useAppDispatch();

  const token = useAppSelector(state => state.auth.token);
  const pendingQueue = useAppSelector(state => state.pendingHaul.queue);

  const [selectedHaul, setSelectedHaul] = useState<HaulApi | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hauls, setHauls] = useState<HaulApi[]>([]);
  const [loading, setLoading] = useState(true);

  // Sefer Gir modal state
  const [addModal, setAddModal] = useState(false);
  const [formPlate, setFormPlate] = useState('');
  const [formPayType, setFormPayType] = useState<0 | 1>(0); // 0=Nakit, 1=Yakıt
  const [formHasLoad, setFormHasLoad] = useState(false);
  const [formTonage, setFormTonage] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Offline banner state
  const [syncing, setSyncing] = useState(false);

  const pendingForThisJob = pendingQueue.filter(h => h.jobSiteId === job?.id);

  // ── Seferleri yükle
  const fetchHauls = async () => {
    if (!token || !job?.id) return;
    try {
      setLoading(true);
      const data = await getJobHauls(token, job.id);
      setHauls(data);
    } catch (error) {
      console.log('Error fetching hauls:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Bekleyen seferleri sunucuya gönder
  const syncPending = useCallback(async () => {
    if (!token || pendingQueue.length === 0) return;
    const online = await checkOnline();
    if (!online) return;

    setSyncing(true);
    let synced = 0;

    for (const pending of pendingQueue) {
      try {
        await createHaul(
          {
            jobSiteId: pending.jobSiteId,
            plateNumber: pending.plateNumber,
            paymentType: pending.paymentType,
            tonage: pending.tonage,
            note: pending.note,
            timeOfHaul: pending.timeOfHaul,
          },
          token
        );
        dispatch(removePendingHaul(pending.localId));
        synced++;
      } catch (err) {
        // Tek hata varsa dur, sonra tekrar dener
        console.log('Sync fail:', pending.localId, err);
      }
    }

    setSyncing(false);
    if (synced > 0) {
      fetchHauls();
      Alert.alert('Senkronize Edildi', `${synced} bekleyen sefer sunucuya gönderildi.`);
    }
  }, [token, pendingQueue]);

  // ── Ekran odaklandığında ve AppState foreground'a döndüğünde sync dene
  useFocusEffect(
    useCallback(() => {
      fetchHauls();
      syncPending();
    }, [token, job?.id])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncPending();
    });
    return () => sub.remove();
  }, [syncPending]);

  // ── Sefer Gir form submit
  const handleAddHaul = async () => {
    const cleanPlate = formPlate.replace(/\s/g, '').toUpperCase();
    if (!cleanPlate) {
      Alert.alert('Eksik Bilgi', 'Plaka numarası zorunludur.');
      return;
    }
    if (formHasLoad && !formTonage) {
      Alert.alert('Eksik Bilgi', 'Tonaj / Litre miktarı giriniz.');
      return;
    }

    const tonageNum = formHasLoad
      ? parseFloat(formTonage.replace(',', '.')) || 0
      : 0;

    const timeNow = new Date().toISOString();

    setFormSaving(true);
    const online = await checkOnline();

    if (online) {
      // ── Online: direkt API
      try {
        await createHaul(
          {
            jobSiteId: job.id,
            plateNumber: cleanPlate,
            paymentType: formPayType,
            tonage: tonageNum,
            note: formNote.trim(),
            timeOfHaul: timeNow,
          },
          token!
        );
        setFormSaving(false);
        closeAddModal();
        fetchHauls();
        Alert.alert('Başarılı', 'Sefer başarıyla kaydedildi.');
      } catch (err: any) {
        setFormSaving(false);
        const msg = err.response?.data?.message || 'Sefer kaydedilemedi.';
        Alert.alert('Hata', msg);
      }
    } else {
      // ── Offline: Redux kuyruğuna ekle
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const pending: PendingHaul = {
        localId,
        jobSiteId: job.id,
        plateNumber: cleanPlate,
        paymentType: formPayType,
        tonage: tonageNum,
        note: formNote.trim(),
        timeOfHaul: timeNow,
        createdAt: timeNow,
      };
      dispatch(addPendingHaul(pending));
      setFormSaving(false);
      closeAddModal();
      Alert.alert(
        'Çevrimdışı Kaydedildi',
        'İnternet bağlantısı yok. Sefer cihazınıza kaydedildi. İnternete bağlandığınızda otomatik gönderilecek.'
      );
    }
  };

  const closeAddModal = () => {
    setAddModal(false);
    setFormPlate('');
    setFormPayType(0);
    setFormHasLoad(false);
    setFormTonage('');
    setFormNote('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}\n${hours}:${minutes}`;
  };

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

  // ── Header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle} numberOfLines={1}>{job?.name || 'Şantiye'}</Text>
        <Text style={styles.headerSubtitle}>{job?.provinceName} • {job?.isActive ? 'Aktif' : 'Pasif'}</Text>
      </View>
    </View>
  );

  // ── Özet kartlar
  const renderSummaryCards = () => (
    <View style={styles.cardsRow}>
      <View style={[styles.card, { backgroundColor: '#F5A623' }]}>
        <Text style={styles.cardLabel}>Toplam Sefer</Text>
        <Text style={styles.cardValue}>{hauls.length + pendingForThisJob.length}</Text>
        <Image source={require('../../../assets/icons/truck.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
      </View>
      <View style={[styles.card, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.cardLabel}>Toplam Tonaj</Text>
        <Text style={styles.cardValue}>{hauls.reduce((a, h) => a + (h.tonage || 0), 0)} Ton</Text>
        <Image source={require('../../../assets/icons/layers.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
      </View>
      <View style={[styles.card, { backgroundColor: '#2196F3' }]}>
        <Text style={styles.cardLabel}>Ödendi</Text>
        <Text style={styles.cardValue}>{hauls.filter(h => h.isPaid).length}</Text>
        <Image source={require('../../../assets/icons/check_circle.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
      </View>
      <View style={[styles.card, { backgroundColor: '#E53935' }]}>
        <Text style={styles.cardLabel}>Bekliyor</Text>
        <Text style={styles.cardValue}>{hauls.filter(h => !h.isPaid).length}</Text>
        <Image source={require('../../../assets/icons/truck.png')} style={[styles.cardIcon, { tintColor: 'white', opacity: 0.5 }]} />
      </View>
    </View>
  );

  // ── Bekleyen satır (offline)
  const renderPendingItem = (item: PendingHaul) => (
    <View key={item.localId} style={styles.pendingRow}>
      <View style={styles.pendingBadge}>
        <Text style={styles.pendingBadgeText}>⏳ Bekliyor</Text>
      </View>
      <Text style={styles.pendingPlate}>{item.plateNumber}</Text>
      <Text style={styles.pendingDate}>{new Date(item.timeOfHaul).toLocaleString('tr-TR')}</Text>
      <Text style={styles.pendingPayType}>
        {item.paymentType === 0 ? '💵 Nakit' : '⛽ Yakıt'}
        {item.tonage > 0 ? `  ${item.tonage} ton` : ''}
      </Text>
    </View>
  );

  // ── Sefer satırı
  const renderHaulItem = (item: HaulApi) => (
    <View key={item.id} style={[styles.haulCard, item.isPaid ? styles.haulCardPaid : styles.haulCardUnpaid]}>
      {/* Üst: Seri No + durum */}
      <View style={styles.haulCardTop}>
        <Text style={styles.haulSerial}>{autoSerial(item)}{item.serialNumber ? `  #${item.serialNumber}` : ''}</Text>
        {item.isPaid
          ? <View style={styles.statusPaid}><Text style={styles.statusPaidText}>✔ Ödendi</Text></View>
          : <View style={styles.statusPending}><Text style={styles.statusPendingText}>⏳ Bekliyor</Text></View>
        }
      </View>

      {/* Orta: Tarih + Plaka | Tonaj + Ödeme */}
      <View style={styles.haulCardMid}>
        <View>
          <Text style={styles.haulDate}>{formatDate(item.timeOfHaul).replace('\n', '  ')}</Text>
          <Text style={styles.haulPlate}>{item.plateNumber}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.tonage > 0 && <Text style={styles.haulTonage}>{item.tonage} kg</Text>}
          {item.cashAmount > 0 && (
            <View style={styles.cashBadge}><Text style={styles.cashBadgeText}>{item.cashAmount.toLocaleString('tr-TR')} ₺</Text></View>
          )}
          {item.fuelAmount > 0 && (
            <View style={styles.fuelBadge}><Text style={styles.fuelBadgeText}>{item.fuelAmount.toLocaleString('tr-TR')} Lt</Text></View>
          )}
        </View>
      </View>

      {/* Alt: Döküm + fiş butonu */}
      <View style={styles.haulCardBot}>
        <Text style={styles.haulDump} numberOfLines={1}>→ {item.dumpLocation || '-'}</Text>
        <TouchableOpacity style={styles.eyeBtn} onPress={() => { setSelectedHaul(item); setModalVisible(true); }}>
          <Text style={styles.eyeBtnText}>👁 Fiş</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.content}>
          {renderSummaryCards()}

          {/* Offline sync banner */}
          {pendingQueue.length > 0 && (
            <TouchableOpacity
              style={styles.syncBanner}
              onPress={syncPending}
              disabled={syncing}
            >
              <Text style={styles.syncBannerText}>
                {syncing
                  ? '🔄 Senkronize ediliyor...'
                  : `📡 ${pendingQueue.length} sefer gönderilmeyi bekliyor. Senkronize et`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Liste başlığı + butonlar */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>📃 Son Seferler</Text>
            <TouchableOpacity style={styles.addHaulBtn} onPress={() => setAddModal(true)}>
              <Text style={styles.addHaulBtnText}>＋ Sefer Gir</Text>
            </TouchableOpacity>
          </View>

          {/* Bekleyen (offline) seferler */}
          {pendingForThisJob.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.pendingTitle}>Çevrimdışı Kaydedilenler</Text>
              {pendingForThisJob.map(renderPendingItem)}
            </View>
          )}

          {/* Sunucudan gelen seferler */}
          {loading ? (
            <ActivityIndicator size="large" color={YELLOW} style={{ marginTop: 20 }} />
          ) : hauls.length === 0 && pendingForThisJob.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36 }}>🚛</Text>
              <Text style={styles.emptyText}>Henüz sefer kaydı yok.</Text>
            </View>
          ) : (
            hauls.map(renderHaulItem)
          )}
        </View>
      </ScrollView>

      {/* ═══════════════ SEFER GİR MODAL ═══════════════ */}
      <Modal visible={addModal} transparent animationType="slide">
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
                  {/* Header */}
                  <View style={styles.addCardHeader}>
                    <Text style={styles.addCardIcon}>🚛</Text>
                    <Text style={styles.addCardTitle}>Sefer Gir</Text>
                    <Text style={styles.addCardSub}>{job?.name}</Text>
                  </View>

                  <View style={styles.addCardBody}>
                    {/* Uyarı */}
                    <View style={styles.warnBox}>
                      <Text style={styles.warnText}>⚠ Kesilen fişler silinemez ve düzenlenemez!</Text>
                    </View>

                    {/* Plaka */}
                    <Text style={styles.fieldLabel}>Plaka *</Text>
                    <TextInput
                      value={formPlate}
                      onChangeText={t => setFormPlate(t.toUpperCase())}
                      style={styles.plateInput}
                      placeholder="34 ABC 123"
                      autoCapitalize="characters"
                      maxLength={14}
                    />
                    <Text style={styles.fieldHint}>Örnek: 34 ABC 123</Text>

                    {/* Ödeme Tipi */}
                    <Text style={styles.fieldLabel}>Ödeme Tipi *</Text>
                    <View style={styles.payTypeRow}>
                      <TouchableOpacity
                        style={[styles.payTypeBtn, formPayType === 0 && styles.payTypeBtnActive]}
                        onPress={() => setFormPayType(0)}
                      >
                        <Text style={[styles.payTypeBtnText, formPayType === 0 && styles.payTypeBtnTextActive]}>
                          💵 Nakit (Para)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.payTypeBtn, formPayType === 1 && styles.payTypeBtnActive]}
                        onPress={() => setFormPayType(1)}
                      >
                        <Text style={[styles.payTypeBtnText, formPayType === 1 && styles.payTypeBtnTextActive]}>
                          ⛽ Yakıt
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Yük Bilgisi Toggle */}
                    <TouchableOpacity
                      style={styles.toggleRow}
                      onPress={() => { setFormHasLoad(v => !v); if (formHasLoad) setFormTonage(''); }}
                    >
                      <View style={[styles.toggleBox, formHasLoad && styles.toggleBoxActive]}>
                        {formHasLoad && <Text style={styles.toggleCheck}>✔</Text>}
                      </View>
                      <Text style={styles.toggleLabel}>Yük bilgisini gir</Text>
                    </TouchableOpacity>

                    {formHasLoad && (
                      <>
                        <Text style={styles.fieldLabel}>
                          {formPayType === 0 ? 'Tonaj' : 'Litre'} *
                        </Text>
                        <View style={styles.tonageRow}>
                          <TextInput
                            value={formTonage}
                            onChangeText={t => {
                              // Sadece rakam ve virgül
                              const clean = t.replace(/[^0-9,]/g, '');
                              setFormTonage(clean);
                            }}
                            style={[styles.tonageInput]}
                            keyboardType="decimal-pad"
                            placeholder={formPayType === 0 ? '25,50' : '1500,00'}
                          />
                          <View style={styles.tonageUnit}>
                            <Text style={styles.tonageUnitText}>
                              {formPayType === 0 ? 'Ton' : 'Lt'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.fieldHint}>Virgül ile ondalık giriniz. Örnek: 25,50</Text>
                      </>
                    )}

                    {/* Not */}
                    <Text style={styles.fieldLabel}>Not <Text style={styles.optional}>(Opsiyonel)</Text></Text>
                    <TextInput
                      value={formNote}
                      onChangeText={setFormNote}
                      style={styles.noteInput}
                      placeholder="Örn: İrsaliye No, Açıklama"
                      maxLength={250}
                      multiline
                    />

                    {/* Gönder */}
                    <TouchableOpacity
                      style={[styles.submitBtn, (!formPlate || formSaving) && { opacity: 0.5 }]}
                      onPress={handleAddHaul}
                      disabled={!formPlate || formSaving}
                    >
                      <Text style={styles.submitBtnText}>
                        {formSaving ? 'Kaydediliyor...' : '✔ Fiş Kes'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={closeAddModal}>
                      <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ═══════════════ FİŞ DETAY MODAL ═══════════════ */}
      {selectedHaul && (
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.receiptModal}>
              {/* Header sarı */}
              <View style={styles.receiptModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.receiptCompany}>
                    {(selectedHaul.companyName || 'HAFRİYAT').toUpperCase()}
                  </Text>
                  <Text style={styles.receiptJobsite}>{selectedHaul.jobSiteName || job?.name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
                    <Text style={styles.receiptDate}>
                      {new Date(selectedHaul.timeOfHaul).toLocaleDateString('tr-TR')}
                    </Text>
                    <Text style={styles.receiptTime}>
                      {new Date(selectedHaul.timeOfHaul).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                {selectedHaul.qrCodeBase64 && (
                  <Image
                    source={{ uri: `data:image/png;base64,${selectedHaul.qrCodeBase64}` }}
                    style={styles.receiptQR}
                  />
                )}
              </View>

              {/* Body */}
              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Seri No</Text><Text style={styles.receiptValue}>{autoSerial(selectedHaul)}</Text></View>
                <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Plaka</Text><Text style={[styles.receiptValue, { fontWeight: '800' }]}>{selectedHaul.plateNumber}</Text></View>
                <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Şoför</Text><Text style={styles.receiptValue}>{selectedHaul.driverPhone || selectedHaul.driverName || '-'}</Text></View>
                <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Döküm</Text><Text style={styles.receiptValue}>{selectedHaul.dumpLocation || '-'}</Text></View>
                {selectedHaul.tonage > 0 && (
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Tonaj</Text><Text style={styles.receiptValue}>{selectedHaul.tonage.toFixed(2)} Ton</Text></View>
                )}
                <View style={[styles.receiptRow, styles.dashedLine]}>
                  <Text style={styles.receiptLabel}>Ücret</Text>
                  <Text style={[styles.receiptValue, { fontSize: 15, fontWeight: '800' }]}>
                    {selectedHaul.cashAmount > 0 ? `${selectedHaul.cashAmount} TL` : ''}
                    {selectedHaul.cashAmount > 0 && selectedHaul.fuelAmount > 0 ? ' / ' : ''}
                    {selectedHaul.fuelAmount > 0 ? `${selectedHaul.fuelAmount} Lt` : ''}
                    {!selectedHaul.cashAmount && !selectedHaul.fuelAmount ? '-' : ''}
                  </Text>
                </View>
                {selectedHaul.contactPhone && (
                  <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Yetkili</Text><Text style={styles.receiptValue}>{selectedHaul.contactPhone}</Text></View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBEA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 8 },
  backArrow: { fontSize: 24, color: '#333' },
  headerContent: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#777' },

  content: { padding: 16 },

  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: { width: '48%', borderRadius: 12, padding: 12, height: 80, justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  cardLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginBottom: 2 },
  cardValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardIcon: { position: 'absolute', right: 8, bottom: 8, width: 30, height: 30 },

  // Sync banner
  syncBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  syncBannerText: { color: '#1565C0', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // Liste başlığı
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  listTitle: { fontSize: 15, fontWeight: '800', color: DARK },
  addHaulBtn: { backgroundColor: YELLOW, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  addHaulBtnText: { fontWeight: '800', fontSize: 13, color: DARK },

  // Pending rows
  pendingTitle: { fontSize: 12, fontWeight: '700', color: '#E65100', marginBottom: 6 },
  pendingRow: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pendingBadge: { backgroundColor: '#FFE0B2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
  pendingPlate: { fontSize: 16, fontWeight: '800', color: DARK },
  pendingDate: { fontSize: 11, color: '#888', marginTop: 2 },
  pendingPayType: { fontSize: 12, color: '#555', marginTop: 2 },

  // Haul cards
  haulCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  haulCardPaid: { backgroundColor: '#fff', borderLeftColor: '#4CAF50' },
  haulCardUnpaid: { backgroundColor: '#FFFDE7', borderLeftColor: '#FFC107' },

  haulCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  haulSerial: { fontSize: 10, color: '#888', fontFamily: 'monospace', backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  statusPaid: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusPaidText: { fontSize: 11, color: '#2E7D32', fontWeight: '700' },
  statusPending: { backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FFC107' },
  statusPendingText: { fontSize: 11, color: '#E65100', fontWeight: '700' },

  haulCardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  haulDate: { fontSize: 11, color: '#888', marginBottom: 2 },
  haulPlate: { fontSize: 17, fontWeight: '800', color: DARK, letterSpacing: 1 },
  haulTonage: { fontSize: 11, color: '#888' },
  cashBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#A5D6A7' },
  cashBadgeText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  fuelBadge: { backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FFD54F' },
  fuelBadgeText: { fontSize: 12, color: '#E65100', fontWeight: '700' },

  haulCardBot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  haulDump: { fontSize: 12, color: '#666', flex: 1 },
  eyeBtn: { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  eyeBtnText: { color: '#1565C0', fontSize: 12, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 8 },

  // ── Sefer Gir Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },

  addCard: { width: '92%', backgroundColor: '#fff', borderRadius: 22, overflow: 'hidden', marginVertical: 20 },
  addCardHeader: { backgroundColor: YELLOW, paddingVertical: 24, alignItems: 'center' },
  addCardIcon: { fontSize: 34, marginBottom: 4 },
  addCardTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  addCardSub: { fontSize: 13, color: '#555', marginTop: 2 },

  addCardBody: { padding: 20 },

  warnBox: { backgroundColor: '#FFCCCB', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ff9999' },
  warnText: { color: '#B00020', fontWeight: '600', fontSize: 12 },

  fieldLabel: { fontWeight: '700', color: '#444', marginBottom: 6, marginTop: 14 },
  fieldHint: { fontSize: 11, color: '#888', marginTop: 4 },
  optional: { fontWeight: '400', color: '#aaa' },

  plateInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 14,
    fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 1,
    backgroundColor: '#FAFAFA',
  },

  payTypeRow: { flexDirection: 'row', gap: 10 },
  payTypeBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  payTypeBtnActive: { borderColor: YELLOW, backgroundColor: '#FFFBEA' },
  payTypeBtnText: { fontWeight: '600', color: '#888', fontSize: 13 },
  payTypeBtnTextActive: { color: DARK, fontWeight: '800' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  toggleBox: { width: 22, height: 22, borderWidth: 2, borderColor: '#ddd', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  toggleBoxActive: { borderColor: YELLOW, backgroundColor: YELLOW },
  toggleCheck: { fontSize: 13, fontWeight: '800', color: DARK },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: DARK },

  tonageRow: { flexDirection: 'row', alignItems: 'center' },
  tonageInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 17, textAlign: 'right',
    borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0,
  },
  tonageUnit: {
    borderWidth: 1.5, borderColor: '#ddd', borderTopRightRadius: 10, borderBottomRightRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#F5F5F5',
  },
  tonageUnitText: { fontSize: 14, fontWeight: '700', color: '#555' },

  noteInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14,
    minHeight: 60, textAlignVertical: 'top',
  },

  submitBtn: { backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelText: { textAlign: 'center', marginTop: 14, color: '#999', fontSize: 14 },

  // ── Fiş Detay Modal
  receiptModal: { width: '90%', backgroundColor: '#FFFBE6', borderRadius: 16, overflow: 'hidden' },
  receiptModalHeader: { backgroundColor: YELLOW, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptCompany: { fontSize: 18, fontWeight: '800', color: DARK },
  receiptJobsite: { fontSize: 13, color: '#555', marginTop: 2 },
  receiptDate: { fontSize: 13, fontWeight: '600', color: DARK },
  receiptTime: { fontSize: 16, fontWeight: '800', color: DARK },
  receiptQR: { width: 76, height: 76, backgroundColor: '#fff', borderRadius: 8 },

  receiptBody: { padding: 18 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)', borderStyle: 'dashed' },
  receiptLabel: { fontSize: 13, color: '#888' },
  receiptValue: { fontSize: 13, color: DARK, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  dashedLine: { borderBottomColor: 'rgba(0,0,0,0.2)' },

  receiptFooter: { padding: 16 },
  closeBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ccc', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#555', fontWeight: '700', fontSize: 15 },
});
