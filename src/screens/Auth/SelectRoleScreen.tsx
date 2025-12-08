import React, { useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '../../hooks';
import { setRole } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SelectRoleScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const selectRole = (role: 'driver' | 'supplier') => {
    dispatch(setRole(role));
    navigation.navigate('Login');
  };

  // return (
  //   <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
  //     <Text style={{ fontSize:20, marginBottom:20 }}>Hoşgeldiniz</Text>

  //     <Button title="Şoför" onPress={() => selectRole('driver')} />
  //     <Button title="Tedarikçi" onPress={() => selectRole('supplier')} />
  //   </View>
  // );
  return (
    <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#F3F2F3' }}>
      <View style={{ flex: 2, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: '80%', height: '80%', marginTop: '20%' }} source={require('../../../assets/login/loginKamyon.png')} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#F3F2F3', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: '100%', height: '100%', marginBottom: '-1%' }} source={require('../../../assets/login/Vector.png')} />
        <Text style={{ position: 'absolute', marginBottom: '20%', fontWeight: '500', fontSize: 18 }}>Hizmetlere erişmek için kayıt olun</Text>
        <TouchableOpacity style={styles.buttonRegister} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.text}>Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFD500', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ position: 'absolute', marginBottom: '65%', fontWeight: '500', fontSize: 18 }}>Kullanıcınız varsa giriş yapın</Text>
        <TouchableOpacity style={styles.buttonLogin} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
          <Text style={styles.text}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonLogin: {
    backgroundColor: '#000', // Siyah arka plan
    height: '25%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
    marginBottom: '40%', // Bulunduğu alanı doldurur
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.96,
    shadowRadius: 2.68,
    elevation: 8,
  },
  buttonRegister: {
    backgroundColor: '#000', // Siyah arka plan
    height: '25%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%', // Bulunduğu alanı doldurur
    marginTop: '10%',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.96,
    shadowRadius: 2.68,
    elevation: 8,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600', // Tasarımdaki gibi yarı-bold
    // marginBottom:'20%'
    // position:'absolute',marginBottom:'20%'
  },
});

export default SelectRoleScreen;
