import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, AuthTokens } from '@/types';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'codetrack_access_token',
  REFRESH_TOKEN: 'codetrack_refresh_token',
  USER_DATA: 'codetrack_user_data',
};

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (err) {
    console.warn(`SecureStore setItem failed for ${key}, falling back to AsyncStorage`, err);
  }
  await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn(`SecureStore getItem failed for ${key}, falling back to AsyncStorage`, err);
  }
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`SecureStore deleteItem failed for ${key}`, err);
  }
  await AsyncStorage.removeItem(key);
}

export const AuthService = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
      setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      deleteItem(TOKEN_KEYS.ACCESS_TOKEN),
      deleteItem(TOKEN_KEYS.REFRESH_TOKEN),
      deleteItem(TOKEN_KEYS.USER_DATA),
    ]);
  },

  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(TOKEN_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEYS.USER_DATA);
  },
};
