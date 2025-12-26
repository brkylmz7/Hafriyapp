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
      }}>
      {/* 🔑 Tabs burada olmalı */}
      <Drawer.Screen name="HomeTabs" component={BottomTabs} options={{ title: 'Anasayfa' }} />

      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />

      <Drawer.Screen name="MyAds" component={MyAds} options={{ title: 'İlanlarım' }} />
    </Drawer.Navigator>
  );
}
