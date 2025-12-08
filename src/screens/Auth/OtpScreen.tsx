import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { verifyOtp } from '../../api/authApi';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { loginSuccess } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';

const OtpScreen = () => {
  const [otp, setOtp] = useState('');
  const dispatch = useAppDispatch();
  const phone = useAppSelector(state => state.auth.phone);
  const navigation = useNavigation<any>();

  const onVerify = async () => {
    const res = await verifyOtp(phone, otp);

    console.log('Verify OTP Response:', res);

    if (res.success && res.token) {
      // ✔ token varsa dispatcher çalışır
      dispatch(loginSuccess({ token: res.token }));

      navigation.reset({
        index: 0,
        routes: [{ name: 'AppTabs' }],
      });
    } else {
      Alert.alert('OTP yanlış veya token yok!');
    }
  };

  // return (
  //   <View style={{ padding: 20 }}>
  //     <Text style={{ fontSize: 16 }}>OTP Kodunu Giriniz</Text>

  //     <TextInput
  //       value={otp}
  //       onChangeText={setOtp}
  //       keyboardType="number-pad"
  //       placeholder="1234"
  //       style={{
  //         borderWidth: 1,
  //         padding: 12,
  //         marginVertical: 20,
  //         borderRadius: 6,
  //       }}
  //     />

  //     <Button title="Doğrula" onPress={onVerify} />
  //   </View>
  // );
  return (
    <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#F3F2F3' }}>
      <View style={{ flex: 2, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: '80%', height: '80%', marginTop: '20%' }} source={require('../../../assets/login/loginKamyon.png')} />
      </View>
      <View style={{ flex: 1, backgroundColor: '#F3F2F3', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Image style={{ width: '100%', height: '100%', marginBottom: '-1%' }} source={require('../../../assets/login/Vector.png')} />
        <Text style={{ position: 'absolute', marginBottom: '20%', fontWeight: '600', fontSize: 20 }}>GİRİŞ YAPIN</Text>
        <TouchableOpacity style={styles.buttonRegister} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.text}>Telefonunuza gelen kodu lütfen girin</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFD500', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        {/* <Text style={{ position: 'absolute', marginBottom: '65%', fontWeight: '500', fontSize: 18 }}>Kullanıcınız varsa giriş yapın</Text> */}
        <TouchableOpacity style={styles.buttonLogin} onPress={() => {}} activeOpacity={0.7}>
          <Text style={styles.text}>ŞOFÖR</Text>
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

export default OtpScreen;
