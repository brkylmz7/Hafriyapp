import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabs from './BottomTabs';
import ProfileScreen from '../screens/ProfileScreen';
import MyAds from '../screens/MyAds';
import CustomHeader from '../components/CustomHeader';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        header: ({ options }) => <CustomHeader title={'HAFRİYAPP'} />,
      }}>
      <Drawer.Screen name="HomeTabs" component={BottomTabs} options={{ title: 'Anasayfa' }} />

      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />

      <Drawer.Screen name="MyAds" component={MyAds} options={{ title: 'İlanlarım' }} />
    </Drawer.Navigator>
  );
}
