import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore } from 'redux-persist';

import counterReducer from './slices/counterSlice';
import authReducer from './slices/authSlice'; // 🔹 YENİ

const rootReducer = combineReducers({
  counter: counterReducer,
  auth: authReducer, // 🔹 YENİ
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'counter'], // 🔹 sadece login bilgisini kalıcı tut
  // counter'ı da saklamak istersen: ['auth', 'counter']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist için şart
    }),
});

export const persistor = persistStore(store);

// RootState artık hem counter hem auth'u içeriyor
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
