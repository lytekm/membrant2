import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StorageAdapter } from '@membrant/client';

export const storage: StorageAdapter = AsyncStorage;
export const sessionStorage: StorageAdapter =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        getItem: SecureStore.getItemAsync,
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: SecureStore.deleteItemAsync,
      };
export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
