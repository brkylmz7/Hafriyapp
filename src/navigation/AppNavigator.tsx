import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import BottomTabs from './BottomTabs';
import ProfileScreen from '../screens/ProfileScreen';
import MyAds from '../screens/MyAds';
import CustomHeader from '../components/CustomHeader';
import CustomDrawerContent from './CustomDrawerContent';
import CompanyChat from '../screens/supplier/CompanyChat';

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

      {/* 💬 CompanyChat is hoisted here to hide the global drawer header and bottom tabs */}
      <Drawer.Screen
        name="CompanyChat"
        component={CompanyChat}
        options={{
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
}
