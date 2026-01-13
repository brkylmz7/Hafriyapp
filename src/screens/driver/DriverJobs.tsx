import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const YELLOW = '#FFD500';
const GRAY = '#F4F4F4';
const DARK = '#222';

type Job = {
  id: string;
  date: string;
  plate: string;
  company: string;
  price: string;
  approved: boolean;
};

const initialData: Job[] = [
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
    plate: '34 FBD 641',
    company: 'KAYA',
    price: '2500₺',
    approved: true,
  },
  {
    id: '328',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '329',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '330',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '331',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'DEMİR',
    price: '2500₺',
    approved: false,
  },
  {
    id: '332',
    date: '06.12.2025',
    plate: '34 FBD 641',
    company: 'ÇEKİÇ',
    price: '45₺',
    approved: false,
  },
];

const DriverJobs = () => {
  const [plate, setPlate] = useState('34 FBD 641');
  const [data, setData] = useState<Job[]>(initialData);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const approveJob = (id: string) => {
    setData(prev => prev.map(item => (item.id === id ? { ...item, approved: true } : item)));
  };

  const openReceipt = (item: Job) => {
    setSelectedJob(item);
    setReceiptVisible(true);
  };

  const closeReceipt = () => {
    setReceiptVisible(false);
    setSelectedJob(null);
  };
  const ReceiptLine = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.lineRow}>
      <Text style={styles.lineLabel}>{label} :</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
  const ActionButton = ({ label, icon }: { label: string; icon: string }) => (
    <TouchableOpacity style={styles.actionBtnNew} activeOpacity={0.8}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Job }) => {
    return (
      <View style={styles.row}>
        <Text style={[styles.cell, { width: 50 }]}>{item.id}</Text>
        <Text style={[styles.cell, { width: 90 }]}>{item.date}</Text>
        <Text style={[styles.cell, { width: 95 }]}>{item.plate}</Text>
        <Text style={[styles.cell, { width: 80 }]} numberOfLines={1}>
          {item.company}
        </Text>
        <Text style={[styles.cell, { width: 70 }]}>{item.price}</Text>

        {/* FİŞ */}
        <TouchableOpacity style={[styles.cellCenter, { width: 40 }]} onPress={() => openReceipt(item)} activeOpacity={0.7}>
          <Text style={{ fontSize: 16 }}>📄</Text>
        </TouchableOpacity>

        {/* ONAY */}
        <View style={styles.onayCell}>
          {item.approved ? (
            <Text style={styles.check}>✔</Text>
          ) : (
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveJob(item.id)} activeOpacity={0.8}>
              <Text style={styles.approveText1}>Onayla</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* PLAKA */}
      <Text style={styles.title}>SÜRDÜĞÜN ARACIN PLAKASINI KAYDET</Text>

      <View style={styles.plateRow}>
        <TextInput value={plate} onChangeText={setPlate} style={styles.plateInput} placeholder="Plaka" placeholderTextColor="#999" />
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveText}>KAYDET</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.info}>
        Şuan attığın seferler alttaki plakaya kaydoluyor:{'\n'}
        <Text style={{ fontWeight: '700' }}>{plate}</Text>
      </Text>

      {/* TABLO (YATAY SCROLL TEK YERDE) */}
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

          {/* LIST */}
          <FlatList data={data} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} />
        </View>
      </ScrollView>

      {/* FİŞ MODAL */}
      <Modal visible={receiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCardNew}>
            {/* HEADER */}
            <View style={styles.receiptHeaderNew}>
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
              {/* LEFT */}
              <View style={{ flex: 1 }}>
                <ReceiptLine label="Tarih" value="07.12.2025" />
                <ReceiptLine label="Seri No" value={selectedJob?.id ?? '-'} />
                <ReceiptLine label="Plaka" value={plate} />
                <ReceiptLine label="Döküm" value="Cebeci 37800" />
                <ReceiptLine label="Ücret" value={`${selectedJob?.price ?? '-'} / 45lt`} />
                <ReceiptLine label="Yetkili" value="532 321 21 21" />
              </View>

              {/* QR */}
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <Text style={{ fontSize: 10 }}>QR</Text>
                </View>
              </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.actionRow}>
              <ActionButton label="İndir" icon="⬇️" />
              <ActionButton label="WhatsApp" icon="✈️" />
              <ActionButton label="Yazdır" icon="🖨️" />
            </View>

            {/* CLOSE */}
            <TouchableOpacity onPress={closeReceipt}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverJobs;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GRAY,
    padding: 16,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: DARK,
  },

  plateRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  plateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
    color: DARK,
  },
  saveBtn: {
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 10,
  },
  saveText: {
    fontWeight: '700',
    color: DARK,
  },

  info: {
    textAlign: 'center',
    fontSize: 12,
    color: '#555',
    marginBottom: 16,
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

  /* ONAY */
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
  approveText1: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
  },
  check: {
    fontSize: 18,
    color: DARK,
  },

  /* MODAL */
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
    borderRadius: 16,
    padding: 16,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  receiptTitle: {
    fontWeight: '700',
    color: DARK,
  },
  receiptSub: {
    fontSize: 12,
    color: '#666',
  },
  receiptTime: {
    fontSize: 12,
    color: '#666',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  qrBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  close: {
    textAlign: 'center',
    marginTop: 12,
    color: '#888',
    fontWeight: '600',
  },
  receiptCardNew: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#000',
  },

  receiptHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD500',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  companyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  siteTitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  receiptBody: {
    flexDirection: 'row',
    marginTop: 8,
  },

  lineRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },

  lineLabel: {
    width: 70,
    fontSize: 11,
    color: '#666',
  },

  lineValue: {
    fontSize: 11,
    fontWeight: '600',
  },

  qrContainer: {
    width: 100,
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

  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },

  closeText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#555',
  },
});
