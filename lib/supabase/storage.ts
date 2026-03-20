/**
 * Supabase auth storage: Sadece bellek (memory) kullanir.
 * Expo Go'da AsyncStorage "Native module is null" verdigi icin
 * kalici depolama kapatildi; oturum uygulama acik kaldigi surece korunur,
 * uygulama kapaninca giris tekrari gerekir.
 */
const memory = new Map<string, string>();

export const supabaseStorage = {
  getItem: async (key: string): Promise<string | null> => memory.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    memory.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    memory.delete(key);
  },
};
