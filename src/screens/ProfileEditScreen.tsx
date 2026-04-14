import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../hooks';
import { updateUserProfile } from '../services/userService';
import { setUser } from '../store/slices/authSlice';

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.token);
  const user = useAppSelector(state => state.auth.user);

  const [loading, setLoading] = useState(false);

  // Form states initialized with Redux user object
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        firstName,
        lastName,
        companyName
      };

      const res = await updateUserProfile(payload, token!);

      if (res) {
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
        // Update local Redux state so the previous screen shows fresh data instantly
        dispatch(setUser({
          ...user,
          firstName,
          lastName,
          companyName
        } as any));

        navigation.navigate('Profile');
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.errorMessage || 'Profil güncellenirken hata oluştu.');
      console.log('Update profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Text style={{ fontSize: 24, marginRight: 8, color: '#F59E0B' }}>✏️</Text>
          <Text style={styles.topBarTitle}>Profil Düzenle</Text>
        </View>
        <Text style={styles.topBarSubtitle}>Hesap bilgilerinizi güncelleyin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📱 Telefon</Text>
            <View style={styles.inputDisabledContainer}>
              <Text style={styles.inputDisabledText}>{user?.phoneNumber || '-'}</Text>
            </View>
            <Text style={styles.inputHint}>Telefon numarası değiştirilemez</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 Ad</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Adınız"
              placeholderTextColor="#AAA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>👤 Soyad</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Soyadınız"
              placeholderTextColor="#AAA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🏢 Firma Adı</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Firma veya Şantiye adınız"
              placeholderTextColor="#AAA"
            />
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.btnCancelText}>✕ İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSave, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.btnSaveText}>✓ Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileEditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFCF6', // very light yellow/beige tint based on screenshot
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
  },
  topBarSubtitle: {
    fontSize: 15,
    color: '#777',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#FFF',
    color: '#333',
  },
  inputDisabledContainer: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#F9F9F9',
  },
  inputDisabledText: {
    fontSize: 15,
    color: '#333',
  },
  inputHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#7A7A7A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSave: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSaveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
