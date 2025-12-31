import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SupplierHome from '../screens/supplier/SupplierHome';
import CompanyChat from '../screens/supplier/CompanyChat';

const Stack = createNativeStackNavigator();

export default function SupplierStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupplierHome" component={SupplierHome} />
      <Stack.Screen name="CompanyChat" component={CompanyChat} />
    </Stack.Navigator>
  );
}
