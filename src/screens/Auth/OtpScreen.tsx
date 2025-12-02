import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
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

    console.log("Verify OTP Response:", res);

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

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 16 }}>OTP Kodunu Giriniz</Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        placeholder="1234"
        style={{
          borderWidth: 1,
          padding: 12,
          marginVertical: 20,
          borderRadius: 6,
        }}
      />

      <Button title="Doğrula" onPress={onVerify} />
    </View>
  );
};

export default OtpScreen;
