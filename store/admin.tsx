import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pos-admin-pin';
const DEFAULT_PIN = '1234';

interface AdminState {
  isAdmin: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (current: string, next: string) => Promise<boolean>;
  isDefaultPin: boolean;
}

const AdminContext = createContext<AdminState | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [pin, setPin] = useState(DEFAULT_PIN);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved && /^\d{4,8}$/.test(saved)) setPin(saved);
      } catch {
        // ignore
      }
    })();
  }, []);

  const unlock = useCallback(
    async (attempt: string) => {
      if (attempt === pin) {
        setIsAdmin(true);
        return true;
      }
      return false;
    },
    [pin],
  );

  const lock = useCallback(() => setIsAdmin(false), []);

  const changePin = useCallback(
    async (current: string, next: string) => {
      if (current !== pin || !/^\d{4,8}$/.test(next)) return false;
      setPin(next);
      try {
        await AsyncStorage.setItem(KEY, next);
      } catch {
        // ignore
      }
      return true;
    },
    [pin],
  );

  const value = useMemo(
    () => ({ isAdmin, unlock, lock, changePin, isDefaultPin: pin === DEFAULT_PIN }),
    [isAdmin, unlock, lock, changePin, pin],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
