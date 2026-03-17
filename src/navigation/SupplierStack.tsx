import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SupplierHome from '../screens/supplier/SupplierHome';

const Stack = createNativeStackNavigator();

export default function SupplierStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupplierHome" component={SupplierHome} />
    </Stack.Navigator>
  );
}
