import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../hooks';

// DRIVER Screens
import DriverHome from '../screens/driver/DriverHome';
import DriverJobs from '../screens/driver/DriverJobs';
import DriverAllJobs from '../screens/driver/AllJobs';

// SUPPLIER Screens
import SupplierHome from '../screens/supplier/SupplierHome';
import SupplierVehicles from '../screens/supplier/SupplierVehicles';
import SupplierAllJobs from '../screens/supplier/AllJobs';
import MyJobs from '../screens/supplier/MyJobs';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const role = useAppSelector(state => state.auth.role);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {role === 'driver' ? (
        <>
          <Tab.Screen name="DriverHome" component={DriverHome} />
          <Tab.Screen name="DriverJobs" component={DriverJobs} />
          <Tab.Screen name="DriverAllJobs" component={DriverAllJobs} />
        </>
      ) : (
        <>
          <Tab.Screen name="SupplierHome" component={SupplierHome} />
          <Tab.Screen name="SupplierAllJobs" component={SupplierAllJobs} />
          <Tab.Screen name="MyJobs" component={MyJobs} />
          <Tab.Screen name="SupplierVehicles" component={SupplierVehicles} />
        </>
      )}
    </Tab.Navigator>
  );
}
