import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('[Storage setItem error]', e);
      try {
        await AsyncStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error('[AsyncStorage fallback error]', fallbackError);
      }
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (e) {
      console.warn('[Storage getItem error]', e);
      try {
        return await AsyncStorage.getItem(key);
      } catch (fallbackError) {
        return null;
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (fallbackError) {
        // ignore
      }
    }
  }
};
