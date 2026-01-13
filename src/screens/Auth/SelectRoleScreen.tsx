import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useAppDispatch } from '../../hooks';
import { setPhone, setRole } from '../../store/slices/authSlice';
import { register } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';

const SelectRoleScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerRole, setRegisterRole] = useState<'driver' | 'supplier'>('driver');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhoneState] = useState('');

  const validateRegister = () => {
    if (registerRole === 'driver') {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert('Hata', 'Ad ve Soyad boş bırakılamaz');
        return false;
      }
    }

    if (registerRole === 'supplier') {
      if (!companyName.trim()) {
        Alert.alert('Hata', 'Firma ünvanı zorunludur');
        return false;
      }
    }

    if (phone.length !== 11) {
      Alert.alert('Hata', 'Telefon numarası 11 haneli olmalıdır');
      return false;
    }

    return true;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        {/* ÜST GÖRSEL */}
        <View style={styles.top}>
          <Image source={require('../../../assets/login/loginKamyon.png')} style={styles.topImage} />
        </View>

        {/* ORTA */}
        <View style={styles.middle}>
          <Image source={require('../../../assets/login/Vector.png')} style={styles.vector} />
          <Text style={styles.middleText}>Hizmetlere erişmek için kayıt olun</Text>

          <TouchableOpacity style={styles.buttonRegister} onPress={() => setShowRegisterModal(true)}>
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

        {/* ALT */}
        <View style={styles.bottom}>
          <Text style={styles.bottomText}>Kullanıcınız varsa giriş yapın</Text>
          <TouchableOpacity style={styles.buttonLogin} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>

        {/* REGISTER MODAL */}
        <Modal visible={showRegisterModal} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalCard} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowRegisterModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Image source={require('../../../assets/logoNew.png')} style={styles.modalIcon} />

                  <Text style={styles.modalTitle}>HafriyApp'e Katılın</Text>
                  <Text style={styles.modalSubtitle}>Ücretsiz hesap oluşturun ve hemen başlayın</Text>

                  <Text style={styles.sectionTitle}>Ne iş yapıyorsunuz?</Text>

                  <View style={styles.roleRow}>
                    <RoleCard title="Şoförüm" desc="Araç kullanıyorum, sefer yapıyorum" active={registerRole === 'driver'} onPress={() => setRegisterRole('driver')} />
                    <RoleCard title="Firma / Araç Sahibi" desc="Firma veya araç sahibiyim" active={registerRole === 'supplier'} onPress={() => setRegisterRole('supplier')} />
                  </View>

                  {registerRole === 'driver' && (
                    <View style={styles.row}>
                      <Input label="Ad" value={firstName} onChange={setFirstName} />
                      <Input label="Soyad" value={lastName} onChange={setLastName} />
                    </View>
                  )}

                  {registerRole === 'supplier' && <Input label="Firma Ünvanı" value={companyName} onChange={setCompanyName} />}

                  <Input label="Telefon Numarası" value={phone} keyboardType="number-pad" placeholder="05XXXXXXXXX" onChange={(text: string) => setPhoneState(text.replace(/\D/g, '').slice(0, 11))} />

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={async () => {
                      if (!validateRegister()) return;

                      try {
                        const payload = {
                          phoneNumber: phone.replace(/\D/g, ''),
                          userType: registerRole === 'driver' ? 1 : 0,
                          firstName: registerRole === 'driver' ? firstName : '',
                          lastName: registerRole === 'driver' ? lastName : '',
                          companyName: registerRole === 'supplier' ? companyName : '',
                        };

                        console.log('REGISTER PAYLOAD', payload);

                        const res = await register(payload);

                        if (!res?.isSuccess) {
                          Alert.alert('Hata', 'Kayıt işlemi başarısız');
                          return;
                        }

                        // 🔐 phone redux’a yaz
                        dispatch(setPhone(payload.phoneNumber));

                        // 🔴 TEST AMAÇLI OTP
                        Alert.alert('OTP Kodu (TEST)', `Gelen Kod: ${res.data.verificationCode}`);

                        setShowRegisterModal(false);
                        navigation.navigate('Otp');
                      } catch (e) {
                        Alert.alert('Hata', 'Kayıt sırasında hata oluştu');
                      }
                    }}>
                    <Text style={styles.submitText}>Kayıt Ol ve SMS Kodu Al</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                    <Text style={styles.loginLink}>Zaten hesabınız var mı? Giriş Yap</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SelectRoleScreen;

/* ---------------- COMPONENTS ---------------- */

const RoleCard = ({ title, desc, active, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.roleCard, active && styles.roleActive]}>
    <Text style={styles.roleTitle}>{title}</Text>
    <Text style={styles.roleDesc}>{desc}</Text>
  </TouchableOpacity>
);

const Input = ({ label, value, onChange, placeholder, keyboardType }: any) => (
  <View style={{ marginBottom: 16, flex: 1 }}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} style={styles.input} returnKeyType="done" blurOnSubmit />
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F2F3' },
  top: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  topImage: { width: '80%', height: '80%', marginTop: '20%' },

  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vector: { width: '100%', height: '100%', position: 'absolute' },
  middleText: { fontSize: 18, fontWeight: '500', marginBottom: 20 },

  bottom: {
    flex: 0.5,
    backgroundColor: '#FFD500',
    alignItems: 'center',
    marginTop: -10,
  },
  bottomText: { fontSize: 18, marginBottom: 12 },

  buttonRegister: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  buttonLogin: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 60,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
  },
  modalIcon: { width: 40, height: 40, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },

  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 14,
    padding: 14,
  },
  roleActive: {
    borderColor: '#FFA500',
    backgroundColor: '#FFF7E6',
  },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  roleDesc: { fontSize: 12, color: '#777', marginTop: 4 },

  row: { flexDirection: 'row', gap: 12 },

  inputLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },

  submitBtn: {
    marginTop: 16,
    backgroundColor: '#FDB515',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  loginLink: {
    marginTop: 14,
    textAlign: 'center',
    color: '#FFA500',
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
});
