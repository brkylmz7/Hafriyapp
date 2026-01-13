import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { RootState } from '../store';

export default function RootNavigator() {
  // 🔐 Keychain → Redux
  useAuthBootstrap();

  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  return <NavigationContainer>{isLoggedIn ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
