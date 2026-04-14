import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, AppState, Share, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { getJobHauls, deleteJobSite } from '../../services/jobSiteNewService';
import { createHaul, HaulApi } from '../../services/haulService';
import {
  addPendingHaul,
  removePendingHaul,
  PendingHaul,
} from '../../store/slices/pendingHaulSlice';

const YELLOW = '#FFD500';
const DARK = '#222';

// ── İnterneti test et (netinfo paketi olmadan)
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

// ── Teklif tipi (Hafriyat: cash=sabit/trip, fuel=sabit/trip | Kum/Mıcır: cash=cashPerTon, fuel=0)
type Offer = {
  name: string;
  cash: number;
  fuel: number;
  material?: string;
  cashPerTon?: number;
  loading?: string;
  unloading?: string;
};

// ── Job'dan teklifleri parse et
const getOffersFromJob = (job: any): Offer[] => {
  const isKum = job?.jobType === 1;
  const offers: Offer[] = [];

  if (isKum) {
    // ── Kum/Mıcır: rotalar extraOffersJson içinde {loading, unloading, cash, material}
    try {
      const extras = JSON.parse(job?.extraOffersJson || '[]');
      if (Array.isArray(extras)) {
        extras.forEach((e: any) => {
          const ld = e.loading || e.Loading || '-';
          const ul = e.unloading || e.Unloading || '-';
          const cashPerTon = parseFloat(e.Cash ?? e.cash ?? 0) || 0;
          offers.push({
            name: `${ld} → ${ul}`,
            cash: cashPerTon,
            fuel: 0,
            material: e.material || e.Material || '',
            cashPerTon,
            loading: ld,
            unloading: ul,
          });
        });
      }
    } catch { }
  } else {
    // ── Hafriyat: yeni birleşik format (isVisible) veya eski offer1Name + extraOffersJson
    try {
      const extras = JSON.parse(job?.extraOffersJson || '[]');
      if (Array.isArray(extras) && extras.length > 0) {
        const hasIsVisible = 'isVisible' in extras[0] || 'IsVisible' in extras[0];
        if (hasIsVisible) {
          // Yeni format: tüm teklifler extraOffersJson içinde
          extras
            .filter((e: any) => e.isVisible !== false && e.IsVisible !== false)
            .forEach((e: any) => {
              const name = e.name || e.Name || '-';
              const cash = parseFloat(e.cash ?? e.Cash ?? 0) || 0;
              const fuel = parseFloat(e.fuel ?? e.Fuel ?? 0) || 0;
              offers.push({ name, cash, fuel });
            });
        } else {
          // Eski format: offer1Name + extras
          if (job?.offer1Name) {
            offers.push({ name: job.offer1Name, cash: Number(job.offer1Cash) || 0, fuel: Number(job.offer1Fuel) || 0 });
          }
          if (job?.offer2Name) {
            offers.push({ name: job.offer2Name, cash: Number(job.offer2Cash) || 0, fuel: Number(job.offer2Fuel) || 0 });
          }
          extras.forEach((e: any) => {
            const name = e.Name || e.name || e.dumpLocation || e.DumpLocation;
            if (name) offers.push({ name, cash: parseFloat(e.Cash ?? e.cash ?? 0) || 0, fuel: parseFloat(e.Fuel ?? e.fuel ?? 0) || 0 });
          });
        }
      }
    } catch { }
    // Fallback: eğer JSON yoksa offer1Name'e bak
    if (offers.length === 0 && job?.offer1Name) {
      offers.push({ name: job.offer1Name, cash: Number(job.offer1Cash) || 0, fuel: Number(job.offer1Fuel) || 0 });
      if (job?.offer2Name) offers.push({ name: job.offer2Name, cash: Number(job.offer2Cash) || 0, fuel: Number(job.offer2Fuel) || 0 });
    }
  }

  return offers;
};

export default function JobDetails() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { job } = route.params || {};
  const dispatch = useAppDispatch();

  const token = useAppSelector(state => state.auth.token);
  const pendingQueue = useAppSelector(state => state.pendingHaul.queue);
  const isKum = job?.jobType === 1;

  // ── Ana liste
  const [selectedHaul, setSelectedHaul] = useState<HaulApi | null>(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [hauls, setHauls] = useState<HaulApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ── Sefer Gir modal
  const [addModal, setAddModal] = useState(false);
  const [formPlate, setFormPlate] = useState('');
  const [selectedOfferIdx, setSelectedOfferIdx] = useState<number | null>(null);
  const [formTonage, setFormTonage] = useState('');   // Kum/Mıcır: kg
  const [formNote, setFormNote] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // ── Manuel Ekle modal (Hafriyat alanları)
  const [manualModal, setManualModal] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [manualDump, setManualDump] = useState('');
  const [manualCash, setManualCash] = useState('');
  const [manualFuel, setManualFuel] = useState('');
  const [manualTonage, setManualTonage] = useState('');
  const [manualNote, setManualNote] = useState('');
  // ── Manuel Ekle modal (Kum/Mıcır alanları)
  const [manualLoading, setManualLoading] = useState('');
  const [manualUnloading, setManualUnloading] = useState('');
  const [manualPricePerTon, setManualPricePerTon] = useState('');
  const [manualMaterial, setManualMaterial] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  const pendingForThisJob = pendingQueue.filter(h => h.jobSiteId === job?.id);
  const offers = getOffersFromJob(job);

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

  // ── Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!token || !job?.id) return;
    setRefreshing(true);
    try {
      const data = await getJobHauls(token, job.id);
      setHauls(data);
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, job?.id]);

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
            cashAmount: pending.cashAmount,
            fuelAmount: pending.fuelAmount,
            dumpLocation: pending.dumpLocation,
            note: pending.note,
            timeOfHaul: pending.timeOfHaul,
            isPrintedReceipt: pending.isPrintedReceipt,
          },
          token
        );
        dispatch(removePendingHaul(pending.localId));
        synced++;
      } catch (err) {
        console.log('Sync fail:', pending.localId, err);
      }
    }
    setSyncing(false);
    if (synced > 0) {
      fetchHauls();
      Alert.alert('Senkronize Edildi', `${synced} bekleyen sefer sunucuya gönderildi.`);
    }
  }, [token, pendingQueue]);

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

  // ── Sefer Gir submit (teklif seçimli)
  const handleAddHaul = async (isPrinted: boolean) => {
    const cleanPlate = formPlate.replace(/\s/g, '').toUpperCase();
    if (!cleanPlate) { Alert.alert('Eksik Bilgi', 'Plaka numarası zorunludur.'); return; }
    if (selectedOfferIdx === null) { Alert.alert('Eksik Bilgi', isKum ? 'Rota seçiniz.' : 'Teklif seçiniz.'); return; }

    const offer = offers[selectedOfferIdx];

    // ── Kum/Mıcır: tonage zorunlu, cashAmount hesaplama
    let tonageKg = 0;
    let cashAmount = offer.cash;
    let fuelAmount = offer.fuel;
    let paymentType = offer.cash > 0 && offer.fuel > 0 ? 2 : offer.fuel > 0 ? 1 : 0;
    let dumpLocation = '';

    if (isKum) {
      tonageKg = parseFloat(formTonage.replace(',', '.')) || 0;
      if (tonageKg <= 0) { Alert.alert('Eksik Bilgi', 'Miktar (kg) giriniz.'); return; }
      const cashPerTon = offer.cashPerTon ?? offer.cash;
      cashAmount = parseFloat((cashPerTon * tonageKg / 1000).toFixed(2));
      fuelAmount = 0;
      paymentType = 0; // nakit
      dumpLocation = offer.name; // "loading → unloading"
    }

    const timeNow = new Date().toISOString();
    setFormSaving(true);
    const online = await checkOnline();

    if (online) {
      try {
        const created = await createHaul(
          {
            jobSiteId: job.id,
            plateNumber: cleanPlate,
            paymentType,
            cashAmount,
            fuelAmount,
            tonage: tonageKg,
            dumpLocation,
            note: formNote.trim(),
            timeOfHaul: timeNow,
            isPrintedReceipt: isPrinted,
          },
          token!
        );
        setFormSaving(false);
        closeAddModal();
        fetchHauls();
        if (isPrinted) {
          setSelectedHaul(created);
          setReceiptVisible(true);
          triggerPrint(created);
        } else {
          Alert.alert('Başarılı', 'Sefer başarıyla kaydedildi.');
        }
      } catch (err: any) {
        setFormSaving(false);
        Alert.alert('Hata', err.response?.data?.message || 'Sefer kaydedilemedi.');
      }
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const pending: PendingHaul = {
        localId,
        jobSiteId: job.id,
        plateNumber: cleanPlate,
        paymentType,
        tonage: tonageKg,
        cashAmount,
        fuelAmount,
        dumpLocation,
        note: formNote.trim(),
        isPrintedReceipt: isPrinted,
        timeOfHaul: timeNow,
        createdAt: timeNow,
      };
      dispatch(addPendingHaul(pending));
      setFormSaving(false);
      closeAddModal();
      Alert.alert('Çevrimdışı Kaydedildi', 'İnternet yok. İnternete bağlandığında otomatik gönderilecek.');
    }
  };

  // ── Manuel Ekle submit
  const handleManualHaul = async () => {
    const cleanPlate = manualPlate.replace(/\s/g, '').toUpperCase();
    if (!cleanPlate) { Alert.alert('Eksik Bilgi', 'Plaka zorunludur.'); return; }

    let dumpLoc: string;
    let cash: number;
    let fuel: number;
    let tonage: number;
    let paymentType: number;

    if (isKum) {
      if (!manualLoading.trim()) { Alert.alert('Eksik Bilgi', 'Yükleme yeri zorunludur.'); return; }
      if (!manualUnloading.trim()) { Alert.alert('Eksik Bilgi', 'Boşaltma yeri zorunludur.'); return; }
      const pricePerTon = parseFloat(manualPricePerTon.replace(',', '.')) || 0;
      if (pricePerTon <= 0) { Alert.alert('Eksik Bilgi', 'Ton başına fiyat giriniz.'); return; }
      const kg = parseFloat(manualTonage.replace(',', '.')) || 0;
      if (kg <= 0) { Alert.alert('Eksik Bilgi', 'Miktar (kg) giriniz.'); return; }
      dumpLoc = `${manualLoading.trim()} → ${manualUnloading.trim()}`;
      tonage = kg;
      cash = parseFloat((pricePerTon * kg / 1000).toFixed(2));
      fuel = 0;
      paymentType = 0;
    } else {
      if (!manualDump.trim()) { Alert.alert('Eksik Bilgi', 'Döküm yeri zorunludur.'); return; }
      dumpLoc = manualDump.trim();
      cash = parseFloat(manualCash.replace(',', '.')) || 0;
      fuel = parseFloat(manualFuel.replace(',', '.')) || 0;
      tonage = parseFloat(manualTonage.replace(',', '.')) || 0;
      paymentType = cash > 0 && fuel > 0 ? 2 : fuel > 0 ? 1 : 0;
    }

    const timeNow = new Date().toISOString();
    setManualSaving(true);
    const online = await checkOnline();

    if (online) {
      try {
        await createHaul(
          {
            jobSiteId: job.id,
            plateNumber: cleanPlate,
            paymentType,
            cashAmount: cash,
            fuelAmount: fuel,
            tonage,
            dumpLocation: dumpLoc,
            note: manualNote.trim(),
            timeOfHaul: timeNow,
            isPrintedReceipt: false,
          },
          token!
        );
        setManualSaving(false);
        closeManualModal();
        fetchHauls();
        Alert.alert('Başarılı', 'Sefer başarıyla kaydedildi.');
      } catch (err: any) {
        setManualSaving(false);
        Alert.alert('Hata', err.response?.data?.message || 'Sefer kaydedilemedi.');
      }
    } else {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      dispatch(addPendingHaul({
        localId,
        jobSiteId: job.id,
        plateNumber: cleanPlate,
        paymentType,
        tonage,
        cashAmount: cash,
        fuelAmount: fuel,
        dumpLocation: dumpLoc,
        note: manualNote.trim(),
        isPrintedReceipt: false,
        timeOfHaul: timeNow,
        createdAt: timeNow,
      }));
      setManualSaving(false);
      closeManualModal();
      Alert.alert('Çevrimdışı Kaydedildi', 'İnternet yok. İnternete bağlandığında otomatik gönderilecek.');
    }
  };

  // ── Yazdır (Share)
  const triggerPrint = async (haul: HaulApi) => {
    const lines = [
      `🚛 HAFRİYAT FİŞİ`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Şantiye : ${haul.jobSiteName || job?.name || '-'}`,
      `Tarih   : ${new Date(haul.timeOfHaul).toLocaleString('tr-TR')}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Plaka   : ${haul.plateNumber}`,
      `Döküm   : ${haul.dumpLocation || '-'}`,
      haul.tonage > 0 ? `Tonaj   : ${haul.tonage.toFixed(2)} Ton` : '',
      haul.cashAmount > 0 ? `Nakit   : ${haul.cashAmount.toLocaleString('tr-TR')} TL` : '',
      haul.fuelAmount > 0 ? `Yakıt   : ${haul.fuelAmount.toLocaleString('tr-TR')} Lt` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: lines });
    } catch { }
  };

  const closeAddModal = () => {
    setAddModal(false);
    setFormPlate('');
    setSelectedOfferIdx(null);
    setFormTonage('');
    setFormNote('');
  };

  const closeManualModal = () => {
    setManualModal(false);
    setManualPlate('');
    setManualDump('');
    setManualCash('');
    setManualFuel('');
    setManualTonage('');
    setManualNote('');
    setManualLoading('');
    setManualUnloading('');
    setManualPricePerTon('');
    setManualMaterial('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}  ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const autoSerial = (haul: HaulApi) => {
    const d = new Date(haul.createdDate);
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  };

  // ── İşi Bitir
  const handleFinishJob = () => {
    Alert.alert(
      'İşi Bitir',
      'Bu işi sonlandırmak istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Bitir',
          style: 'destructive',
          onPress: async () => {
            if (!token || !job?.id) return;
            try {
              await deleteJobSite(token, job.id);
              navigation.goBack();
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'İş sonlandırılırken bir sorun oluştu.';
              Alert.alert('Hata', msg);
            }
          },
        },
      ],
    );
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
      <TouchableOpacity style={styles.finishBtn} onPress={handleFinishJob}>
        <Text style={styles.finishBtnText}>İşi Bitir</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Özet çubuğu (compact tek satır)
  const renderSummaryCards = () => {
    const todayStr = new Date().toDateString();
    const todayCount = hauls.filter(h => new Date(h.timeOfHaul).toDateString() === todayStr).length
      + pendingForThisJob.filter(h => new Date(h.timeOfHaul).toDateString() === todayStr).length;
    const totalTonKg = hauls.reduce((a, h) => a + (h.tonage || 0), 0);
    const totalTonDisplay = isKum
      ? `${(totalTonKg / 1000).toFixed(1)}t`
      : `${hauls.reduce((a, h) => a + (h.fuelAmount || 0), 0).toFixed(0)}lt`;
    const totalTonLabel = isKum ? 'Toplam Ton' : 'Yakıt';

    return (
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#E65100' }]}>{todayCount}</Text>
          <Text style={styles.summaryLabel}>Bugün</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{hauls.length + pendingForThisJob.length}</Text>
          <Text style={styles.summaryLabel}>Toplam</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#1976D2' }]}>{totalTonDisplay}</Text>
          <Text style={styles.summaryLabel}>{totalTonLabel}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: '#E53935' }]}>{hauls.filter(h => !h.isPaid).length}</Text>
          <Text style={styles.summaryLabel}>Bekliyor</Text>
        </View>
      </View>
    );
  };

  // ── Bekleyen satır (offline)
  const renderPendingItem = (item: PendingHaul) => (
    <View key={item.localId} style={styles.pendingRow}>
      <View style={styles.pendingBadge}>
        <Text style={styles.pendingBadgeText}>⏳ Bekliyor</Text>
      </View>
      <Text style={styles.pendingPlate}>{item.plateNumber}</Text>
      <Text style={styles.pendingDate}>{new Date(item.timeOfHaul).toLocaleString('tr-TR')}</Text>
      <Text style={styles.pendingPayType}>
        {item.cashAmount > 0 ? `💵 ${item.cashAmount.toLocaleString('tr-TR')} TL` : ''}
        {item.cashAmount > 0 && item.fuelAmount > 0 ? '  ' : ''}
        {item.fuelAmount > 0 ? `⛽ ${item.fuelAmount.toLocaleString('tr-TR')} Lt` : ''}
        {item.tonage > 0 ? `  ${item.tonage} ton` : ''}
      </Text>
    </View>
  );

  // ── Material lookup helper (Kum/Mıcır)
  const getMaterialFromDumpLocation = (dumpLocation: string): string => {
    if (!isKum || !dumpLocation) return '';
    const match = offers.find(o => o.name === dumpLocation);
    return match?.material || '';
  };

  // ── Sefer kartı
  const renderHaulItem = (item: HaulApi) => {
    const material = getMaterialFromDumpLocation(item.dumpLocation || '');
    return (
    <View key={item.id} style={[styles.haulCard, item.isPaid ? styles.haulCardPaid : styles.haulCardUnpaid]}>
      <View style={styles.haulCardTop}>
        <Text style={styles.haulSerial}>{autoSerial(item)}{item.serialNumber ? `  #${item.serialNumber}` : ''}</Text>
        {item.isPrintedReceipt && (
          <View style={styles.printedBadge}><Text style={styles.printedBadgeText}>🖨 Yazdırıldı</Text></View>
        )}
        {item.isPaid
          ? <View style={styles.statusPaid}><Text style={styles.statusPaidText}>✔ Ödendi</Text></View>
          : <View style={styles.statusPending}><Text style={styles.statusPendingText}>⏳ Bekliyor</Text></View>
        }
      </View>

      <View style={styles.haulCardMid}>
        <View>
          <Text style={styles.haulDate}>{formatDate(item.timeOfHaul)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.haulPlate}>{item.plateNumber}</Text>
            {!!material && (
              <View style={styles.materialBadge}><Text style={styles.materialBadgeText}>{material}</Text></View>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.tonage > 0 && (
            <Text style={styles.haulTonage}>
              {isKum ? `${item.tonage.toLocaleString('tr-TR')} kg` : `${(item.tonage / 1000).toFixed(2)} t`}
            </Text>
          )}
          {item.cashAmount > 0 && (
            <View style={styles.cashBadge}><Text style={styles.cashBadgeText}>{item.cashAmount.toLocaleString('tr-TR')} ₺</Text></View>
          )}
          {item.fuelAmount > 0 && (
            <View style={styles.fuelBadge}><Text style={styles.fuelBadgeText}>{item.fuelAmount.toLocaleString('tr-TR')} Lt</Text></View>
          )}
        </View>
      </View>

      <View style={styles.haulCardBot}>
        <Text style={styles.haulDump} numberOfLines={1}>→ {item.dumpLocation || '-'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.printBtn} onPress={() => triggerPrint(item)}>
            <Text style={styles.printBtnText}>🖨 Yazdır</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.eyeBtn} onPress={() => { setSelectedHaul(item); setReceiptVisible(true); }}>
            <Text style={styles.eyeBtnText}>👁 Fiş</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
      >
        <View style={styles.content}>
          {renderSummaryCards()}

          {/* Offline sync banner */}
          {pendingQueue.length > 0 && (
            <TouchableOpacity style={styles.syncBanner} onPress={syncPending} disabled={syncing}>
              <Text style={styles.syncBannerText}>
                {syncing ? '🔄 Senkronize ediliyor...' : `📡 ${pendingQueue.length} sefer gönderilmeyi bekliyor. Senkronize et`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Liste başlığı + butonlar */}
          <View style={styles.listHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.listTitle}>Son Seferler</Text>
              <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh} disabled={refreshing}>
                <Text style={styles.refreshIconText}>{refreshing ? '⏳' : '🔄'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={styles.manualBtn} onPress={() => setManualModal(true)}>
                <Text style={styles.manualBtnText}>Manuel Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addHaulBtn} onPress={() => setAddModal(true)}>
                <Text style={styles.addHaulBtnText}>＋ Sefer Gir</Text>
              </TouchableOpacity>
            </View>
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

      {/* ═══════════════ SEFER GİR MODAL (Teklifli) ═══════════════ */}
      <Modal visible={addModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center' }}>
                <View style={styles.addCard}>
                  {/* Header */}
                  <View style={styles.addCardHeader}>
                    <Text style={styles.addCardHeaderText}>🚛  Yeni Sefer Kaydı</Text>
                    <TouchableOpacity onPress={closeAddModal} style={styles.closeX}>
                      <Text style={styles.closeXText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addCardBody}>
                    {/* Plaka */}
                    <Text style={styles.fieldLabel}>Plaka Numarası <Text style={styles.req}>*</Text></Text>
                    <TextInput
                      value={formPlate}
                      onChangeText={t => setFormPlate(t.toUpperCase())}
                      style={styles.plateInput}
                      placeholder="34 ABC 123"
                      autoCapitalize="characters"
                      maxLength={14}
                    />

                    {/* Rota / Teklif Seçiniz */}
                    <Text style={[styles.fieldLabel, { marginTop: 18 }]}>{isKum ? 'Rota Seçiniz' : 'Teklif Seçiniz'}</Text>
                    {offers.length === 0 ? (
                      <View style={styles.noOfferBox}>
                        <Text style={styles.noOfferText}>⚠ Bu şantiye için {isKum ? 'rota' : 'teklif'} tanımlanmamış.</Text>
                      </View>
                    ) : (
                      offers.map((offer, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.offerItem, selectedOfferIdx === idx && styles.offerItemSelected]}
                          onPress={() => setSelectedOfferIdx(idx)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.offerName}>{offer.name}</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                              {isKum && !!offer.material && (
                                <View style={styles.materialBadge}>
                                  <Text style={styles.materialBadgeText}>{offer.material}</Text>
                                </View>
                              )}
                              {offer.cash > 0 && (
                                <View style={styles.offerCashBadge}>
                                  <Text style={styles.offerCashText}>
                                    {offer.cash.toLocaleString('tr-TR')} {isKum ? '₺/ton' : '₺'}
                                  </Text>
                                </View>
                              )}
                              {!isKum && offer.fuel > 0 && (
                                <View style={styles.offerFuelBadge}>
                                  <Text style={styles.offerFuelText}>{offer.fuel.toLocaleString('tr-TR')} Lt</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <View style={[styles.radioCircle, selectedOfferIdx === idx && styles.radioCircleSelected]}>
                            {selectedOfferIdx === idx && <View style={styles.radioDot} />}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}

                    {/* Kum/Mıcır: Miktar (kg) */}
                    {isKum && (
                      <>
                        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Miktar (kg) <Text style={styles.req}>*</Text></Text>
                        <TextInput
                          value={formTonage}
                          onChangeText={t => setFormTonage(t.replace(/[^0-9,]/g, ''))}
                          style={styles.textInput}
                          placeholder="Örn: 12000"
                          keyboardType="decimal-pad"
                        />
                        {selectedOfferIdx !== null && !!formTonage && (
                          <View style={styles.calcBox}>
                            <Text style={styles.calcBoxText}>
                              Hesaplanan Tutar: {(
                                (offers[selectedOfferIdx]?.cashPerTon ?? offers[selectedOfferIdx]?.cash ?? 0) *
                                (parseFloat(formTonage.replace(',', '.')) || 0) / 1000
                              ).toFixed(2)} ₺
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* Not */}
                    <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Opsiyonel <Text style={styles.optional}>(Not)</Text></Text>
                    <TextInput
                      value={formNote}
                      onChangeText={setFormNote}
                      style={styles.noteInput}
                      placeholder="Örn: İrsaliye No, Açıklama"
                      maxLength={250}
                      multiline
                    />
                  </View>

                  {/* Footer butonları */}
                  <View style={styles.addCardFooter}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={closeAddModal}>
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sanalBtn, (!formPlate || selectedOfferIdx === null || (isKum && !formTonage) || formSaving) && { opacity: 0.4 }]}
                      onPress={() => handleAddHaul(false)}
                      disabled={!formPlate || selectedOfferIdx === null || (isKum && !formTonage) || formSaving}
                    >
                      <Text style={styles.sanalBtnText}>Sanal Fiş Kes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.printSubmitBtn, (!formPlate || selectedOfferIdx === null || (isKum && !formTonage) || formSaving) && { opacity: 0.4 }]}
                      onPress={() => handleAddHaul(true)}
                      disabled={!formPlate || selectedOfferIdx === null || (isKum && !formTonage) || formSaving}
                    >
                      <Text style={styles.printSubmitBtnText}>
                        {formSaving ? '...' : 'Fiş Kes ve Yazdır'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ═══════════════ MANUEL EKLE MODAL ═══════════════ */}
      <Modal visible={manualModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center' }}>
                <View style={styles.addCard}>
                  {/* Header */}
                  <View style={[styles.addCardHeader, { backgroundColor: '#546E7A' }]}>
                    <Text style={styles.addCardHeaderText}>✏  Manuel Sefer Gir</Text>
                    <TouchableOpacity onPress={closeManualModal} style={styles.closeX}>
                      <Text style={styles.closeXText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addCardBody}>
                    {/* Plaka */}
                    <Text style={styles.fieldLabel}>Plaka Numarası <Text style={styles.req}>*</Text></Text>
                    <TextInput
                      value={manualPlate}
                      onChangeText={t => setManualPlate(t.toUpperCase())}
                      style={styles.plateInput}
                      placeholder="34 ABC 123"
                      autoCapitalize="characters"
                      maxLength={14}
                    />

                    {isKum ? (
                      <>
                        {/* Yükleme Yeri */}
                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Yükleme Yeri <Text style={styles.req}>*</Text></Text>
                        <TextInput
                          value={manualLoading}
                          onChangeText={setManualLoading}
                          style={styles.textInput}
                          placeholder="Örn: Ocak Adı"
                        />

                        {/* Boşaltma Yeri */}
                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Boşaltma Yeri <Text style={styles.req}>*</Text></Text>
                        <TextInput
                          value={manualUnloading}
                          onChangeText={setManualUnloading}
                          style={styles.textInput}
                          placeholder="Örn: Şantiye Adı"
                        />

                        {/* Malzeme */}
                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Malzeme <Text style={styles.optional}>(Opsiyonel)</Text></Text>
                        <TextInput
                          value={manualMaterial}
                          onChangeText={setManualMaterial}
                          style={styles.textInput}
                          placeholder="Örn: Kum, Mıcır"
                        />

                        {/* Fiyat/ton + Miktar */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: '#2E7D32' }]}>Fiyat (₺/ton) <Text style={styles.req}>*</Text></Text>
                            <TextInput
                              value={manualPricePerTon}
                              onChangeText={t => setManualPricePerTon(t.replace(/[^0-9,]/g, ''))}
                              style={styles.textInput}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: '#E65100' }]}>Miktar (kg) <Text style={styles.req}>*</Text></Text>
                            <TextInput
                              value={manualTonage}
                              onChangeText={t => setManualTonage(t.replace(/[^0-9,]/g, ''))}
                              style={styles.textInput}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>

                        {/* Hesaplanan Tutar */}
                        {!!manualPricePerTon && !!manualTonage && (
                          <View style={styles.calcBox}>
                            <Text style={styles.calcBoxText}>
                              Hesaplanan Tutar: {(
                                (parseFloat(manualPricePerTon.replace(',', '.')) || 0) *
                                (parseFloat(manualTonage.replace(',', '.')) || 0) / 1000
                              ).toFixed(2)} ₺
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Döküm Yeri */}
                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Döküm Yeri / Açıklama <Text style={styles.req}>*</Text></Text>
                        <TextInput
                          value={manualDump}
                          onChangeText={setManualDump}
                          style={styles.textInput}
                          placeholder="Örn: Serbest Döküm"
                        />

                        {/* Nakit + Mazot */}
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: '#2E7D32' }]}>Nakit (TL)</Text>
                            <TextInput
                              value={manualCash}
                              onChangeText={t => setManualCash(t.replace(/[^0-9,]/g, ''))}
                              style={styles.textInput}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: '#E65100' }]}>Mazot (Lt)</Text>
                            <TextInput
                              value={manualFuel}
                              onChangeText={t => setManualFuel(t.replace(/[^0-9,]/g, ''))}
                              style={styles.textInput}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>

                        {/* Tonaj */}
                        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Tonaj <Text style={styles.optional}>(Opsiyonel)</Text></Text>
                        <TextInput
                          value={manualTonage}
                          onChangeText={t => setManualTonage(t.replace(/[^0-9,]/g, ''))}
                          style={styles.textInput}
                          placeholder="0"
                          keyboardType="decimal-pad"
                        />
                      </>
                    )}

                    {/* Not */}
                    <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Not <Text style={styles.optional}>(Opsiyonel)</Text></Text>
                    <TextInput
                      value={manualNote}
                      onChangeText={setManualNote}
                      style={styles.noteInput}
                      placeholder="Örn: İrsaliye No, Açıklama"
                      maxLength={250}
                      multiline
                    />
                  </View>

                  <View style={[styles.addCardFooter, { justifyContent: 'flex-end' }]}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={closeManualModal}>
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.manualSaveBtn, (
                        !manualPlate ||
                        (isKum ? (!manualLoading || !manualUnloading || !manualPricePerTon || !manualTonage) : !manualDump) ||
                        manualSaving
                      ) && { opacity: 0.4 }]}
                      onPress={handleManualHaul}
                      disabled={
                        !manualPlate ||
                        (isKum ? (!manualLoading || !manualUnloading || !manualPricePerTon || !manualTonage) : !manualDump) ||
                        manualSaving
                      }
                    >
                      <Text style={styles.manualSaveBtnText}>
                        {manualSaving ? 'Kaydediliyor...' : '✔ Kaydet'}
                      </Text>
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
        <Modal visible={receiptVisible} transparent animationType="fade" onRequestClose={() => setReceiptVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* Fiş kart */}
            <View style={styles.receiptCard}>

              {/* Sol şerit — "HAFRİYAPP" dikey */}
              <View style={styles.receiptStrip}>
                <Text style={styles.receiptStripText}>HAFRİYAPP</Text>
              </View>

              {/* Ana içerik */}
              <View style={styles.receiptMain}>

                {/* ── Başlık: firma + saat + QR ── */}
                <View style={styles.receiptHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptCompanyName}>
                      {(selectedHaul.companyName || 'HAFRİYAT').toUpperCase()}
                    </Text>
                    <Text style={styles.receiptDistrict}>
                      {job?.districtName || job?.provinceName || ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.receiptTimeText}>
                      {new Date(selectedHaul.timeOfHaul).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {selectedHaul.qrCodeBase64 && (
                      <Image
                        source={{ uri: `data:image/png;base64,${selectedHaul.qrCodeBase64}` }}
                        style={styles.receiptQRImg}
                      />
                    )}
                  </View>
                </View>

                {/* Tarih satırı */}
                <View style={styles.receiptDateRow}>
                  <Text style={styles.receiptDateText}>
                    {new Date(selectedHaul.timeOfHaul).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                {/* ── Satırlar ── */}
                <View style={styles.receiptBody}>
                  {/* Seri No */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Seri No</Text>
                    <Text style={styles.receiptRowValue}>{autoSerial(selectedHaul)}</Text>
                  </View>

                  {/* Plaka + Şoför */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Plaka</Text>
                    <Text style={[styles.receiptRowValue, { fontWeight: '800' }]}>
                      {selectedHaul.plateNumber}
                      {(selectedHaul.driverName || selectedHaul.driverPhone)
                        ? `   Şoför  ${selectedHaul.driverName || selectedHaul.driverPhone}`
                        : ''}
                    </Text>
                  </View>

                  {/* Döküm */}
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Döküm</Text>
                    <Text style={[styles.receiptRowValue, { fontWeight: '800' }]}>
                      {selectedHaul.dumpLocation || '-'}
                    </Text>
                  </View>

                  {/* Tonaj (opsiyonel) */}
                  {selectedHaul.tonage > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptRowLabel}>Tonaj</Text>
                      <Text style={styles.receiptRowValue}>{selectedHaul.tonage.toFixed(2)} Ton</Text>
                    </View>
                  )}

                  {/* Ücret */}
                  <View style={[styles.receiptRow, styles.receiptRowUcret]}>
                    <Text style={[styles.receiptRowLabel, { fontWeight: '700' }]}>Ücret</Text>
                    <Text style={[styles.receiptRowValue, { fontSize: 15, fontWeight: '800' }]}>
                      {[
                        selectedHaul.cashAmount > 0 ? `${selectedHaul.cashAmount.toLocaleString('tr-TR')}₺` : '',
                        selectedHaul.fuelAmount > 0 ? `${selectedHaul.fuelAmount.toLocaleString('tr-TR')}lt` : '',
                      ].filter(Boolean).join('/') || '-'}
                    </Text>
                  </View>

                  {/* Yetkili */}
                  {!!selectedHaul.contactPhone && (
                    <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.receiptRowLabel}>Yetkili</Text>
                      <Text style={styles.receiptRowValue}>{selectedHaul.contactPhone}</Text>
                    </View>
                  )}
                </View>

                {/* ── Footer butonlar ── */}
                <View style={styles.receiptFooterRow}>
                  <TouchableOpacity
                    style={styles.receiptCloseBtnNew}
                    onPress={() => setReceiptVisible(false)}
                  >
                    <Text style={styles.receiptCloseBtnNewText}>Kapat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptPrintBtnNew}
                    onPress={() => triggerPrint(selectedHaul)}
                  >
                    <Text style={styles.receiptPrintBtnNewText}>🖨 Yazdır</Text>
                  </TouchableOpacity>
                </View>

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
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 8 },
  backArrow: { fontSize: 24, color: '#333' },
  headerContent: { flex: 1, marginLeft: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#777' },
  finishBtn: {
    backgroundColor: '#FFF0EE',
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  finishBtnText: { fontSize: 12, color: '#E53935', fontWeight: '700' },

  content: { padding: 16 },

  summaryBar: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: DARK },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EEEEEE' },

  syncBanner: {
    backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#90CAF9',
  },
  syncBannerText: { color: '#1565C0', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 12,
  },
  listTitle: { fontSize: 15, fontWeight: '800', color: DARK },
  refreshIconBtn: { padding: 4 },
  refreshIconText: { fontSize: 16 },
  addHaulBtn: { backgroundColor: '#1976D2', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  addHaulBtnText: { fontWeight: '800', fontSize: 13, color: '#fff' },
  manualBtn: { backgroundColor: '#F5F5F5', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ccc' },
  manualBtnText: { fontWeight: '700', fontSize: 13, color: '#555' },

  pendingTitle: { fontSize: 12, fontWeight: '700', color: '#E65100', marginBottom: 6 },
  pendingRow: {
    backgroundColor: '#FFF8E1', borderLeftWidth: 4, borderLeftColor: '#FFA000',
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  pendingBadge: { backgroundColor: '#FFE0B2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#E65100' },
  pendingPlate: { fontSize: 16, fontWeight: '800', color: DARK },
  pendingDate: { fontSize: 11, color: '#888', marginTop: 2 },
  pendingPayType: { fontSize: 12, color: '#555', marginTop: 2 },

  haulCard: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  haulCardPaid: { backgroundColor: '#fff', borderLeftColor: '#4CAF50' },
  haulCardUnpaid: { backgroundColor: '#FFFDE7', borderLeftColor: '#FFC107' },

  haulCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 },
  haulSerial: { fontSize: 10, color: '#888', fontFamily: 'monospace', backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flex: 1 },
  printedBadge: { backgroundColor: '#E3F2FD', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  printedBadgeText: { fontSize: 10, color: '#1565C0', fontWeight: '600' },
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
  eyeBtn: { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  eyeBtnText: { color: '#1565C0', fontSize: 12, fontWeight: '700' },
  printBtn: { borderWidth: 1.5, borderColor: '#546E7A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  printBtnText: { color: '#546E7A', fontSize: 12, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 8 },

  // ── Modal overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },

  // ── Sefer Gir / Manuel Ekle card
  addCard: { width: '92%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginVertical: 20 },
  addCardHeader: {
    backgroundColor: '#1976D2', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20,
  },
  addCardHeaderText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  closeX: { padding: 4 },
  closeXText: { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  addCardBody: { padding: 20 },
  addCardFooter: {
    flexDirection: 'row', gap: 8, padding: 16, backgroundColor: '#F9F9F9',
    borderTopWidth: 1, borderTopColor: '#eee', flexWrap: 'wrap',
  },

  // Fields
  fieldLabel: { fontWeight: '700', color: '#444', marginBottom: 6 },
  req: { color: '#E53935' },
  optional: { fontWeight: '400', color: '#aaa' },
  plateInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 14,
    fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 1,
    backgroundColor: '#FAFAFA',
  },
  textInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, backgroundColor: '#FAFAFA',
  },
  noteInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14,
    minHeight: 60, textAlignVertical: 'top',
  },

  // Material badge (Kum/Mıcır)
  materialBadge: { backgroundColor: '#E3F2FD', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#90CAF9' },
  materialBadgeText: { fontSize: 11, color: '#1565C0', fontWeight: '700' },

  // Hesaplanan tutar kutusu
  calcBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#A5D6A7' },
  calcBoxText: { color: '#2E7D32', fontWeight: '700', fontSize: 14, textAlign: 'center' },

  // Offer items
  noOfferBox: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FFD54F' },
  noOfferText: { color: '#E65100', fontSize: 13, fontWeight: '600' },
  offerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  offerItemSelected: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  offerName: { fontSize: 15, fontWeight: '700', color: DARK },
  offerCashBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  offerCashText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  offerFuelBadge: { backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  offerFuelText: { color: '#E65100', fontWeight: '700', fontSize: 13 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#1976D2' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1976D2' },

  // Footer buttons
  cancelBtn: { backgroundColor: '#455A64', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sanalBtn: { flex: 1, borderWidth: 2, borderColor: '#1976D2', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  sanalBtnText: { color: '#1976D2', fontWeight: '800', fontSize: 13 },
  printSubmitBtn: { flex: 1, backgroundColor: '#1976D2', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  printSubmitBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  manualSaveBtn: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  manualSaveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // ── Fiş Detay Modal (yeni tasarım)
  receiptCard: {
    width: '90%',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },

  // Sol dikey şerit
  receiptStrip: {
    width: 32,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptStripText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    transform: [{ rotate: '-90deg' }],
    width: 120,
    textAlign: 'center',
  },

  // Ana içerik alanı
  receiptMain: {
    flex: 1,
  },

  // Başlık satırı
  receiptHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  receiptCompanyName: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 0.5,
  },
  receiptDistrict: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  receiptTimeText: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  receiptQRImg: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginTop: 6,
    backgroundColor: '#f0f0f0',
  },

  // Tarih satırı
  receiptDateRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ddd',
  },
  receiptDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },

  // Satırlar
  receiptBody: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    borderStyle: 'dashed',
  },
  receiptRowUcret: {
    borderBottomColor: 'rgba(0,0,0,0.18)',
    borderBottomWidth: 1.5,
  },
  receiptRowLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    minWidth: 58,
  },
  receiptRowValue: {
    fontSize: 13,
    color: DARK,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 8,
  },

  // Footer butonlar
  receiptFooterRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 4,
  },
  receiptCloseBtnNew: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  receiptCloseBtnNewText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 14,
  },
  receiptPrintBtnNew: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  receiptPrintBtnNewText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
