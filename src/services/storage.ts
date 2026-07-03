import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper genérico e tipado sobre o AsyncStorage. Isola o resto do app da
 * biblioteca de persistência — trocar por SQLite/servidor depois só exige
 * reimplementar este arquivo.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.warn(`[storage] falha ao ler "${key}"`, err);
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[storage] falha ao gravar "${key}"`, err);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] falha ao remover "${key}"`, err);
    }
  },
};
