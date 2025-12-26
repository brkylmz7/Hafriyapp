import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { verifyOtp, sendOtp } from '../../api/authApi';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { loginSuccess } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const CELL_COUNT = 4;

const OtpScreen = () => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(120);
  const phone = useAppSelector(state => state.auth.phone);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
  const [codeFieldProps, getCellOnLayoutHandler] = useClearByFocusCell({
    value: otp,
    setValue: setOtp,
  });

  useEffect(() => {
    let interval: any;

    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const onVerify = async () => {
    console.log('otp', otp);
    if (otp == '5555') {
      dispatch(loginSuccess({ token: 'asdasd' }));
    }
    // const res = await verifyOtp(phone, otp);
    // if (res.success && res.token) {
    //   dispatch(loginSuccess({ token: res.token }));
    //   navigation.reset({ index: 0, routes: [{ name: 'AppTabs' }] });
    // } else {
    //   Alert.alert('OTP yanlış!');
    // }
  };

  const onResend = async () => {
    setTimer(120);
    const res = await sendOtp(phone);
    if (res.success) Alert.alert('Kod gönderildi');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* 🎨 Arka plan gradient */}
      <LinearGradient colors={['#FFE259', '#FFD500', '#F7B500']} style={styles.gradientBg} />
      <TouchableOpacity style={{ position: 'absolute', left: '2%', top: '10%' }} onPress={() => navigation.goBack()}>
        <Image style={{ width: 25, height: 25 }} source={require('../../../assets/login/left-arrow.png')} />
      </TouchableOpacity>
      {/* 📌 İçerik sabit View içinde → artık reset yok */}
      <View style={styles.container}>
        <Image style={{ marginBottom: '0%', width: 350, height: 350 }} source={require('../../../assets/logoText.png')} />
        <Text style={styles.title}>OTP Kodunu Giriniz</Text>
        <Text style={styles.subtitle}>{phone}</Text>

        <CodeField
          ref={ref}
          {...codeFieldProps}
          value={otp}
          onChangeText={setOtp}
          cellCount={CELL_COUNT}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          rootStyle={styles.codeFieldRoot}
          renderCell={({ index, symbol, isFocused }) => (
            <Text key={index} style={[styles.cell, isFocused && styles.focusCell]} onLayout={getCellOnLayoutHandler(index)}>
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          )}
        />

        <TouchableOpacity style={[styles.verifyButton, otp.length === 4 && styles.verifyButtonActive]} disabled={otp.length !== 4} onPress={onVerify}>
          <Text style={styles.verifyText}>Doğrula</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 30 }}>
          {timer > 0 ? (
            <Text style={styles.timer}>Kodu tekrar göndermek için: {formatTime(timer)}</Text>
          ) : (
            <TouchableOpacity onPress={onResend}>
              <Text style={styles.resend}>Tekrar Gönder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  gradientBg: {
    ...StyleSheet.absoluteFillObject, // 📌 tam ekran gradient
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#555',
  },
  codeFieldRoot: {
    marginTop: 20,
    width: '75%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  cell: {
    width: 55,
    height: 55,
    lineHeight: 50,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#DDD',
    textAlign: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.96,
    shadowRadius: 2.68,
    elevation: 8,
  },
  focusCell: {
    borderColor: '#2a2a2aff',
  },
  verifyButton: {
    marginTop: 40,
    width: '90%',
    height: 52,
    backgroundColor: '#2c2c2cff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonActive: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.96,
    shadowRadius: 2.68,
    elevation: 8,
  },
  verifyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  timer: {
    fontSize: 16,
    color: '#444',
  },
  resend: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textDecorationLine: 'underline',
  },
});
