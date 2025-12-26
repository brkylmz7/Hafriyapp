import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';

const YELLOW = '#FFD500';

export default function CustomDrawerContent(props: any) {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: YELLOW,
    alignItems: 'center',
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
