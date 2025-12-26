import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';

export default function RootNavigator() {
  const isLoggedIn = useSelector((state: any) => state.auth.isLoggedIn);

  return <NavigationContainer>{isLoggedIn ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
