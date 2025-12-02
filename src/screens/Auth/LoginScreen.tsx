import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useAppDispatch } from '../../hooks';
import { setPhone } from '../../store/slices/authSlice';
import { sendOtp } from '../../api/authApi';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [phone, setPhoneState] = useState('');
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const onContinue = async () => {
    dispatch(setPhone(phone));
    
    const res = await sendOtp(phone);

    if (res.success) {
      navigation.navigate('Otp');
    } else {
      Alert.alert('Numara bulunamadı!');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Telefon Numaranızı Giriniz</Text>

      <TextInput
        placeholder="5xx xxx xx xx"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhoneState}
        style={{
          borderWidth: 1,
          padding: 10,
          marginVertical: 20,
          borderRadius: 6
        }}
      />

      <Button title="Devam Et" onPress={onContinue} />
    </View>
  );
};

export default LoginScreen;
