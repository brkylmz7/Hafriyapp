import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAppDispatch } from '../../hooks';
import { setRole } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';

const SelectRoleScreen = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const selectRole = (role: 'driver' | 'supplier') => {
    dispatch(setRole(role));
    navigation.navigate('Login');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ fontSize:20, marginBottom:20 }}>Hoşgeldiniz</Text>

      <Button title="Şoför" onPress={() => selectRole('driver')} />
      <Button title="Tedarikçi" onPress={() => selectRole('supplier')} />
    </View>
  );
};

export default SelectRoleScreen;
