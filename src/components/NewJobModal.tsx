import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAppSelector } from '../hooks';
import { createJobSite } from '../services/jobSiteNewService';

type OfferType = 'DOKUM' | 'AL_GOTUR';
type PaymentType = 'NAKIT' | 'YAKIT';

export default function NewJobModal({ onClose }: { onClose: () => void }) {
  /* ================= STATE ================= */
  const token = useAppSelector(state => state.auth.token);
  const companyId = useAppSelector(state => state.auth.user?.id);
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

  const handleSave = async () => {
    if (!siteName || !city || !phone) {
      Alert.alert('Zorunlu alanları doldurun');
      return;
    }
  
    const offer1PaymentMap = mapPaymentToAmounts(offer1Payment);
    const offer2PaymentMap = mapPaymentToAmounts(offer2Payment);
  
    const payload = {
      companyId,
      name: siteName,
      jobType: offer1Type === 'DOKUM' ? 0 : 1,
      provinceCode: Number(city), // ileride dropdown
      districtName: location,
      locationUrl: '',
      description,
      contactPhone: phone,
      fuelStock: 0,
  
      offer1Name: mapOfferTypeToName(offer1Type),
      offer1Cash: offer1PaymentMap.cash,
      offer1Fuel: offer1PaymentMap.fuel,
  
      offer2Name: mapOfferTypeToName(offer2Type),
      offer2Cash: offer2PaymentMap.cash,
      offer2Fuel: offer2PaymentMap.fuel,
  
      extraOffersJson: buildExtraOffersJson(),
  
      hasCash: offer1Payment === 'NAKIT' || offer2Payment === 'NAKIT',
      hasFuel: offer1Payment === 'YAKIT' || offer2Payment === 'YAKIT',
  
      fuelLiters: 0,
      hasSand: false,
      sandFuelLiters: 0,
      cashAmount: 0,
  
      loadingStartTime: '',
      loadingEndTime: '',
    };
  
    console.log('📦 JOBSITE PAYLOAD', payload);
  
    try {
      await createJobSite(token!, payload);
      onClose();
    } catch (e) {
      console.log('❌ createJobSite error', e);
      Alert.alert('İş oluşturulamadı');
    }
  };

  const mapOfferTypeToName = (type: OfferType | null) => {
    if (type === 'DOKUM') return 'Döküm';
    if (type === 'AL_GOTUR') return 'Al Götür';
    return '';
  };
  const mapPaymentToAmounts = (payment: PaymentType | null) => {
    return {
      cash: payment === 'NAKIT' ? 1 : 0,
      fuel: payment === 'YAKIT' ? 1 : 0,
    };
  };
  const buildExtraOffersJson = () => {
    const offers: any[] = [];
  
    if (offer1Type) {
      offers.push({
        offerNo: 1,
        type: offer1Type,
        payment: offer1Payment,
      });
    }
  
    if (offer2Type) {
      offers.push({
        offerNo: 2,
        type: offer2Type,
        payment: offer2Payment,
      });
    }
  
    return JSON.stringify(offers);
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
