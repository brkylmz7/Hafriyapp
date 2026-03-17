import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverHome from '../screens/driver/DriverHome';

const Stack = createNativeStackNavigator();

export default function DriverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverHome" component={DriverHome} />
    </Stack.Navigator>
  );
}
