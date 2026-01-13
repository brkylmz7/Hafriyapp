import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { useAppSelector } from '../hooks';
import { ScrollView } from 'react-native-gesture-handler';

const ProfileScreen = () => {
  const user = useAppSelector(state => state.auth.user);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Kullanıcı bilgileri yükleniyor...</Text>
      </View>
    );
  }

  const isDriver = user.userType === 1;

  /* ---------------- STATES ---------------- */
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [companyName, setCompanyName] = useState('');

  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');

  const [profileChanged, setProfileChanged] = useState(false);
  const [authChanged, setAuthChanged] = useState(false);

  /* ---------------- CHANGE DETECT ---------------- */
  useEffect(() => {
    if (firstName !== user.firstName || lastName !== user.lastName || phoneNumber !== user.phoneNumber || (!isDriver && companyName !== '')) {
      setProfileChanged(true);
    } else {
      setProfileChanged(false);
    }
  }, [firstName, lastName, phoneNumber, companyName]);

  useEffect(() => {
    if (authName || authPhone) {
      setAuthChanged(true);
    } else {
      setAuthChanged(false);
    }
  }, [authName, authPhone]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F4F4F4' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* 🔶 AVATAR */}
      <View style={styles.avatarWrapper}>
        <Image source={require('../../assets/icons/avatar.png')} style={styles.avatar} />
        <TouchableOpacity style={styles.addPhotoButton}>
          <Text style={styles.addPhotoText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.photoNote}>{isDriver ? 'Şoför iseniz profil fotoğrafınızı ekleyebilirsiniz' : 'Firmanızın logosunu veya profil fotoğrafınızı ekleyebilirsiniz'}</Text>

      {/* 👤 KULLANICI / FİRMA KARTI */}
      <View style={styles.card}>
        <EditableRow label="Ad" value={firstName} onChange={setFirstName} />
        <EditableRow label="Soyad" value={lastName} onChange={setLastName} />
        <EditableRow label="Telefon" value={phoneNumber} onChange={setPhoneNumber} />

        {!isDriver && <EditableRow label="Firma Adı" value={companyName} onChange={setCompanyName} />}

        <SaveButton
          visible={profileChanged}
          title="Bilgileri Kaydet"
          onPress={() => {
            console.log('PROFILE SAVE');
          }}
        />
      </View>

      {/* 🏢 YETKİLİ KİŞİLER (SADECE SUPPLIER) */}
      {!isDriver && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Firmanıza Yetkili Kişileri Ekleyin</Text>

          <EditableRow label="Ad Soyad" value={authName} onChange={setAuthName} />
          <EditableRow label="Telefon" value={authPhone} onChange={setAuthPhone} />

          <SaveButton
            visible={authChanged}
            title="Yetkili Kaydet"
            onPress={() => {
              console.log('AUTH PERSON SAVE');
            }}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default ProfileScreen;

const InfoRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};
const EditableRow = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={label} />
    </View>
  );
};
const SaveButton = ({ visible, title, onPress }: { visible: boolean; title: string; onPress: () => void }) => {
  if (!visible) return null;

  return (
    <TouchableOpacity style={styles.saveButton} onPress={onPress}>
      <Text style={styles.saveText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    paddingTop: 40,
  },
  scrollContent: {
    flexGrow: 1, // 🔥 EN KRİTİK SATIR
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 80, // 🔥 alta rahat inmesi için
    backgroundColor: '#F4F4F4',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* AVATAR */
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#DDD',
  },
  addPhotoButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  addPhotoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },

  /* NOTE */
  photoNote: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  /* CARD */
  card: {
    marginTop: 30,
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#888',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },

  /* LOGOUT */
  logoutButton: {
    marginTop: 40,
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 14,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#FFD500',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
