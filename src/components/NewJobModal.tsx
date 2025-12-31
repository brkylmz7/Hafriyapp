import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

type OfferType = 'DOKUM' | 'AL_GOTUR';
type PaymentType = 'NAKIT' | 'YAKIT';

export default function NewJobModal({ onClose }: { onClose: () => void }) {
  /* ================= STATE ================= */

  const [siteName, setSiteName] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [material, setMaterial] = useState('');
  const [description, setDescription] = useState('');

  // Teklif 1
  const [offer1Type, setOffer1Type] = useState<OfferType | null>(null);
  const [offer1Payment, setOffer1Payment] = useState<PaymentType | null>(null);

  // Teklif 2
  const [offer2Type, setOffer2Type] = useState<OfferType | null>(null);
  const [offer2Payment, setOffer2Payment] = useState<PaymentType | null>(null);

  /* ================= ACTION ================= */

  const handleSave = () => {
    const payload = {
      siteName,
      city,
      location,
      phone,
      material,
      description,
      offers: [
        {
          offerNo: 1,
          type: offer1Type,
          payment: offer1Payment,
        },
        {
          offerNo: 2,
          type: offer2Type,
          payment: offer2Payment,
        },
      ],
    };

    console.log('📦 NEW JOB PAYLOAD:', payload);

    // ileride:
    // dispatch(createJob(payload))
    // onClose()
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HEADER */}
      <View style={{ alignItems: 'center', flexDirection: 'row', marginTop: '5%' }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>YENİ İŞİNİZİ KURUN</Text>
      </View>

      <View style={styles.divider} />

      {/* INPUTS */}
      <TextInput style={styles.input} placeholderTextColor={'grey'} placeholder="Şantiye İsmi *" value={siteName} onChangeText={setSiteName} />

      {/* TEKLİF 1 */}
      <Text style={styles.section}>Teklif 1</Text>
      <View style={styles.row}>
        <Chip text="Döküm Yeri" selected={offer1Type === 'DOKUM'} onPress={() => setOffer1Type('DOKUM')} />
        <Chip text="Nakit" selected={offer1Payment === 'NAKIT'} onPress={() => setOffer1Payment('NAKIT')} />
        <Chip text="Yakıt" selected={offer1Payment === 'YAKIT'} onPress={() => setOffer1Payment('YAKIT')} />
      </View>

      {/* TEKLİF 2 */}
      <Text style={styles.section}>Teklif 2</Text>
      <View style={styles.row}>
        <Chip text="Al Götür" selected={offer2Type === 'AL_GOTUR'} onPress={() => setOffer2Type('AL_GOTUR')} />
        <Chip text="Nakit" selected={offer2Payment === 'NAKIT'} onPress={() => setOffer2Payment('NAKIT')} />
        <Chip text="Yakıt" selected={offer2Payment === 'YAKIT'} onPress={() => setOffer2Payment('YAKIT')} />
      </View>

      <TextInput style={styles.input} placeholderTextColor={'grey'} placeholder="Şehir *" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholderTextColor={'grey'} placeholder="Konum" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholderTextColor={'grey'} placeholder="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholderTextColor={'grey'} placeholder="Malzeme" value={material} onChangeText={setMaterial} />

      <TextInput style={[styles.input, { height: 100 }]} placeholder="Ayrıntılı açıklamalar..." multiline value={description} onChangeText={setDescription} />

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={{ fontWeight: '700' }}>KAYDET</Text>
      </TouchableOpacity>

      <Text style={styles.warning}>* Yıldızlı alanlar zorunludur.</Text>
    </ScrollView>
  );
}

/* ================= CHIP ================= */

const Chip = ({ text, selected, onPress }: { text: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]} activeOpacity={0.7}>
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F2F2F2', paddingTop: '10%' },
  back: { fontSize: 22, marginBottom: 16, marginLeft: '20%' },
  title: { fontWeight: '800', textAlign: 'center', marginBottom: 16 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 0.27,

    elevation: 2,
  },

  section: { fontWeight: '700', marginTop: '2%' },
  row: { flexDirection: 'row', gap: 8, marginBottom: '5%' },

  chip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: '4%',
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 0.27,

    elevation: 2,
  },

  saveBtn: {
    backgroundColor: '#FFD500',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: 'rgba(0, 0, 0, 1)',
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.34,
    shadowRadius: 0.37,

    elevation: 2,
  },

  warning: {
    fontSize: 11,
    color: '#777',
    marginTop: 10,
  },
  divider: {
    width: '120%',
    height: 1,
    backgroundColor: 'grey',
    marginBottom: '5%',
    alignSelf: 'center',
  },

  chipSelected: {
    backgroundColor: '#FFD500',
  },

  chipText: {
    fontSize: 13,
  },

  chipTextSelected: {
    fontWeight: '700',
  },
});
