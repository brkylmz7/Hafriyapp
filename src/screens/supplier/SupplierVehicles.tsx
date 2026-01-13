import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const YELLOW = '#FFD500';
const GRAY = '#F4F4F4';
const DARK = '#222';

/* ================= DATA ================= */

const summary = {
  spentFuel: '548097 lt',
  collectedCash: '548097 ₺',
  expectedCash: '12034 ₺',
  todayTrips: 17,
  monthlyTrips: 242,
  paidTrips: 161,
  unpaidTrips: 81,
};

const vehicles = [
  { id: '1', plate: '34 NNB 521', fuel: '1350 lt', cash: '189000 ₺' },
  { id: '2', plate: '34 NNB 497', fuel: '980 lt', cash: '145000 ₺' },
];

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
  {
    id: '329',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '330',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '331',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '332',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '333',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '334',
    date: '06.12.2025',
    plate: '34 NNB 741',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
];

/* ================= SCREEN ================= */

export default function SupplierVehicles() {
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const openReceipt = (item: any) => {
    setSelectedTrip(item);
    setReceiptVisible(true);
  };

  const closeReceipt = () => {
    setReceiptVisible(false);
    setSelectedTrip(null);
  };

  /* ================= HELPERS ================= */

  const ReceiptLine = ({ label, value }: any) => (
    <View style={styles.lineRow}>
      <Text style={styles.lineLabel}>{label} :</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );

  const ActionButton = ({ label, icon }: any) => (
    <TouchableOpacity style={styles.actionBtnNew} activeOpacity={0.8}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  /* ================= RENDERS ================= */

  const renderVehicle = ({ item }: any) => (
    <View style={styles.vehicleRow}>
      <Text style={[styles.vehicleCellText, { width: 120 }]}>{item.plate}</Text>

      <Text style={[styles.vehicleCellText, { width: 100 }]}>{item.fuel}</Text>

      <Text style={[styles.vehicleCellText, { width: 110 }]}>{item.cash}</Text>

      <View style={{ width: 110, alignItems: 'center' }}>
        <TouchableOpacity style={styles.outlineBtn}>
          <Text>Şoför Ata</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: 110, alignItems: 'center' }}>
        <TouchableOpacity style={styles.outlineBtn}>
          <Text>Yakıt Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
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

      <TouchableOpacity style={[styles.cellCenter, { width: 40 }]} onPress={() => openReceipt(item)}>
        <Text style={{ fontSize: 16 }}>📄</Text>
      </TouchableOpacity>

      <View style={styles.onayCell}>
        {item.approved ? (
          <Text style={styles.check}>✔</Text>
        ) : (
          <TouchableOpacity style={styles.approveBtn}>
            <Text style={styles.approveText}>Onayla</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ================= HEADER ================= */}
      <Text style={styles.title}>FİRMANIZA AİT ARAÇLAR</Text>

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <SummaryBox label="Harcanan Yakıt" value={summary.spentFuel} />
        <SummaryBox label="Toplanan Nakit" value={summary.collectedCash} />
        <SummaryBox label="Beklenen Nakit" value={summary.expectedCash} />
      </View>

      <View style={styles.stats}>
        <Text>Bugün atılan seferler: {summary.todayTrips}</Text>
        <Text>Aylık atılan seferler: {summary.monthlyTrips}</Text>
        <Text>Ödemesi alınan: {summary.paidTrips}</Text>
        <Text>Ödemesi alınmayan: {summary.unpaidTrips}</Text>
      </View>

      {/* ================= VEHICLES ================= */}
      <Text style={styles.sectionTitle}>ARAÇLAR</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: 560 }}>
          {/* HEADER */}
          <View style={styles.vehicleTableHeader}>
            <Text style={[styles.vehicleHead, { width: 120 }]}>Plaka</Text>
            <Text style={[styles.vehicleHead, { width: 100 }]}>Harcanan Yakıt</Text>
            <Text style={[styles.vehicleHead, { width: 110 }]}>Toplanan Para</Text>
            <Text style={[styles.vehicleHead, { width: 110 }]}>Şoför</Text>
            <Text style={[styles.vehicleHead, { width: 110 }]}>Yakıt</Text>
          </View>

          {/* LIST */}
          <FlatList data={vehicles} keyExtractor={i => i.id} renderItem={renderVehicle} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false} />
        </View>
      </ScrollView>

      {/* ================= TRIPS TABLE ================= */}
      <Text style={styles.sectionTitle}>ARAÇLARINIZA AİT SEFERLER</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: 520 }}>
          {/* HEADER */}
          <View style={styles.tableHeader}>
            <Text style={[styles.hCell, { width: 50 }]}>Seri</Text>
            <Text style={[styles.hCell, { width: 90 }]}>Tarih</Text>
            <Text style={[styles.hCell, { width: 95 }]}>Plaka</Text>
            <Text style={[styles.hCell, { width: 80 }]}>Firma</Text>
            <Text style={[styles.hCell, { width: 70 }]}>Ödeme</Text>
            <Text style={[styles.hCell, { width: 40 }]}>Fiş</Text>
            <Text style={[styles.hCell, { width: 70 }]}>Onay</Text>
          </View>

          <FlatList data={trips} keyExtractor={i => i.id} renderItem={renderTrip} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} />
        </View>
      </ScrollView>

      {/* ================= RECEIPT MODAL ================= */}
      <Modal visible={receiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            {/* HEADER */}
            <View style={styles.receiptHeader}>
              <View style={styles.logoCircle}>
                <Image source={require('../../../assets/logoNew.png')} style={styles.logoImage} />
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.companyTitle}>KAYA HAFRİYAT</Text>
                <Text style={styles.siteTitle}>GÜNEŞLİ ŞANTİYESİ</Text>
              </View>

              <Text style={styles.timeText}>13:26</Text>
            </View>

            {/* BODY */}
            <View style={styles.receiptBody}>
              <View style={{ flex: 1 }}>
                <ReceiptLine label="Tarih" value="07.12.2025" />
                <ReceiptLine label="Seri No" value={selectedTrip?.id ?? '-'} />
                <ReceiptLine label="Plaka" value={selectedTrip?.plate ?? '-'} />
                <ReceiptLine label="Döküm" value="Cebeci 37800" />
                <ReceiptLine label="Ücret" value={selectedTrip?.price ?? '-'} />
                <ReceiptLine label="Yetkili" value="532 321 21 21" />
              </View>

              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <Text>QR</Text>
                </View>
              </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.actionRow}>
              <ActionButton label="İndir" icon="⬇️" />
              <ActionButton label="WhatsApp" icon="✈️" />
              <ActionButton label="Yazdır" icon="🖨️" />
            </View>

            <TouchableOpacity onPress={closeReceipt}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= SMALL ================= */

const SummaryBox = ({ label, value }: any) => (
  <View style={styles.summaryBox}>
    <Text style={{ fontSize: 11 }}>{label}</Text>
    <Text style={{ fontWeight: '700' }}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GRAY, paddingLeft: 10, paddingRight: 10, paddingTop: 10 },

  title: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 12,
    color: DARK,
    marginTop: '-10%',
  },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: {
    backgroundColor: '#eee',
    borderRadius: 14,
    padding: 10,
    width: '32%',
    alignItems: 'center',
  },

  stats: { marginVertical: 10, marginLeft: '5%' },

  sectionTitle: {
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    color: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '5%',
  },

  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  plate: { width: 90, fontWeight: '700', color: DARK },
  vehicleCell: { width: 80, color: DARK },

  outlineBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 6,
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 6,
  },

  hCell: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: DARK,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  cell: {
    fontSize: 11,
    textAlign: 'center',
    color: DARK,
  },

  cellCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  onayCell: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveBtn: {
    backgroundColor: YELLOW,
    width: 60,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveText: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
  },

  check: { fontSize: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  receiptCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#000',
  },

  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: { width: 30, height: 30, resizeMode: 'contain' },

  companyTitle: { fontSize: 14, fontWeight: '800' },
  siteTitle: { fontSize: 12, fontWeight: '600' },
  timeText: { fontSize: 12, fontWeight: '600' },

  receiptBody: { flexDirection: 'row', marginTop: 8 },

  lineRow: { flexDirection: 'row', marginVertical: 2 },
  lineLabel: { width: 70, fontSize: 11, color: '#666' },
  lineValue: { fontSize: 11, fontWeight: '600' },

  qrContainer: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qrBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  actionBtnNew: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },

  actionText: { fontSize: 11, fontWeight: '600' },

  closeText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#555',
  },
  vehicleTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 6,
    marginBottom: 4,
  },

  vehicleHead: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222',
  },

  vehicleCellText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#222',
  },
});
