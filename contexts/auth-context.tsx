import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'psikoapp_pin';
const AUTO_LOCK_KEY = 'psikoapp_auto_lock';

interface AuthContextType {
  isLocked: boolean;
  hasPIN: boolean;
  setupPIN: (pin: string) => Promise<void>;
  removePIN: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  checkPIN: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);

  const checkPIN = useCallback(async (): Promise<boolean> => {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    const has = !!pin;
    setHasPIN(has);
    return has;
  }, []);

  useEffect(() => {
    checkPIN().then(has => {
      if (has) setIsLocked(true);
    });
  }, [checkPIN]);

  const setupPIN = useCallback(async (pin: string) => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setHasPIN(true);
    setIsLocked(false);
  }, []);

  const removePIN = useCallback(async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setHasPIN(false);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    if (stored === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isLocked, hasPIN, setupPIN, removePIN, unlock, lock, checkPIN }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
