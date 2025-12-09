import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function CustomHeader({ title = '', subtitle = 'HARFİYAT VE BAHÇE TOPRAĞI TAŞIMA UYGULAMASI' }: HeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* SOL TARAF: LOGO + YAZILAR */}
        <View style={styles.leftBox}>
          <Image source={require('../../assets/logokarakalem.png')} style={styles.logo} resizeMode="contain" />

          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {/* SAĞ TARAF: HAMBURGER ICON */}
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/menus.png')} style={styles.menuIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFD500',
  },
  container: {
    height: 60,
    backgroundColor: '#FFD500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    elevation: 2,
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 9,
    marginTop: 2,
    color: '#666',
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 28,
    height: 28,
    tintColor: '#000',
  },
});
