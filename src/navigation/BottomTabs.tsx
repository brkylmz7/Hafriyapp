import React from 'react';
import { View, Image } from 'react-native';
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
import SupplierStack from './SupplierStack';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const role = useAppSelector(state => state.auth.role);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: {
          backgroundColor: '#FFD500',
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      {role === 'driver' ? (
        <>
          {/* DRIVER HOME */}
          <Tab.Screen
            name="DriverHome"
            component={DriverHome}
            options={{
              title: 'Anasayfa',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/home.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? 'black' : '#444',
                    }}
                  />
                </View>
              ),
            }}
          />

          {/* DRIVER ALL JOBS */}
          <Tab.Screen
            name="DriverAllJobs"
            component={DriverAllJobs}
            options={{
              title: 'Piyasa İşleri',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 10 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/excavator.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? 'black' : '#444',
                    }}
                  />
                </View>
              ),
            }}
          />

          {/* DRIVER JOBS */}
          <Tab.Screen
            name="DriverJobs"
            component={DriverJobs}
            options={{
              title: 'Seferlerim',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/drive.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? 'black' : '#444',
                    }}
                  />
                </View>
              ),
            }}
          />
        </>
      ) : (
        <>
          {/* SUPPLIER HOME */}
          <Tab.Screen
            name="SupplierHome"
            component={SupplierStack}
            options={{
              title: 'Anasayfa',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/home.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? '#4444' : 'black',
                    }}
                  />
                </View>
              ),
            }}
          />

          {/* SUPPLIER ALL JOBS */}
          <Tab.Screen
            name="SupplierAllJobs"
            component={SupplierAllJobs}
            options={{
              title: 'Tüm İşler',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/excavator.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? '#444' : 'black',
                    }}
                  />
                </View>
              ),
            }}
          />

          {/* SUPPLIER MY JOBS */}
          <Tab.Screen
            name="MyJobs"
            component={MyJobs}
            options={{
              title: 'İşlerim',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/icons/drive.png')}
                    style={{
                      width: 35,
                      height: 35,
                      tintColor: focused ? '#444' : 'black',
                    }}
                  />
                </View>
              ),
            }}
          />

          {/* SUPPLIER VEHICLES */}
          <Tab.Screen
            name="SupplierVehicles"
            component={SupplierVehicles}
            options={{
              title: 'Araçlarım',
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    paddingHorizontal: focused ? 20 : 0,
                    paddingVertical: focused ? 15 : 0,
                    backgroundColor: focused ? '#F7B500' : 'transparent',
                    borderRadius: 99,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={require('../../assets/logokarakalem.png')}
                    style={{
                      width: 45,
                      height: 45,
                      tintColor: focused ? '#444' : 'black',
                    }}
                  />
                </View>
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}
