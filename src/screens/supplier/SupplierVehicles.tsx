import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../hooks/index';
import { increment } from '../../store/slices/counterSlice';

const SupplierVehicles = () => {
  const count = useAppSelector(state => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>SupplierVehicles</Text>
      <Button title="Increase" onPress={() => dispatch(increment())} />
    </View>
  );
};

export default SupplierVehicles;
