import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabs from './BottomTabs';
import ProfileScreen from '../screens/ProfileScreen';
import MyAds from '../screens/MyAds';
import CustomHeader from '../components/CustomHeader';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        header: () => <CustomHeader title="HAFRİYAPP" />,

        // ✅ AKTİF
        drawerActiveBackgroundColor: '#FFD500',
        drawerActiveTintColor: '#000',

        // ✅ PASİF
        drawerInactiveTintColor: '#444',

        drawerItemStyle: {
          borderRadius: 999,
          marginHorizontal: 12,
          marginVertical: 6,
        },

        drawerLabelStyle: {
          fontSize: 17,
          fontWeight: '800',
        },
      }}>
      <Drawer.Screen name="HomeTabs" component={BottomTabs} options={{ title: 'ANASAYFA' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'PROFİLİM' }} />
      <Drawer.Screen name="MyAds" component={MyAds} options={{ title: 'İLANLARIM' }} />
    </Drawer.Navigator>
  );
}
