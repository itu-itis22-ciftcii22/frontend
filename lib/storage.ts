import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface PairedIndicator {
  name: string;
  params: Record<string, any>;
  timeframe: string;
  value?: number | null;
}


export interface WatchlistEntry {
  id?: number;
  symbol: string;
  timeframe: string;
  pairedIndicators: PairedIndicator[];
  associatedStrategies?: number[];
  associatedChartConfigId?: number;
  associatedChartConfigIds?: number[];
  name?: string;
  sector?: string;
  industry?: string;
  currency?: string;
  exchange?: string;
  tags?: string[];
}


const isWeb = Platform.OS === 'web';

const getStorageKey = (userId: number | string, key: string) => {
  return `@assetview:${userId}:${key}`;
};

export async function getWatchlist(userId: number | string): Promise<WatchlistEntry[]> {
  const key = getStorageKey(userId, 'watchlist');
  try {
    if (isWeb) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } else {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error('Error reading watchlist from storage:', error);
    return [];
  }
}

export async function setWatchlist(userId: number | string, entries: WatchlistEntry[]): Promise<void> {
  const key = getStorageKey(userId, 'watchlist');
  try {
    const serialized = JSON.stringify(entries);
    if (isWeb) {
      localStorage.setItem(key, serialized);
    } else {
      await AsyncStorage.setItem(key, serialized);
    }
  } catch (error) {
    console.error('Error writing watchlist to storage:', error);
  }
}

export async function clearUserData(userId: number | string): Promise<void> {
  const key = getStorageKey(userId, 'watchlist');
  try {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error clearing user data from storage:', error);
  }
}
