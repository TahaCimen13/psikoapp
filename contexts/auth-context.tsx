import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_KEY = 'psikoapp_pin';
const AUTO_LOCK_KEY = 'psikoapp_auto_lock';

// Arka planda bu süreden uzun kalınırsa dönüşte PIN istenir (dakika).
export const DEFAULT_AUTO_LOCK_MINUTES = 1;

// PIN düz metin yerine tuzlanmış SHA-256 olarak saklanır: "v1:<salt>:<hash>"
async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function randomSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  isLocked: boolean;
  hasPIN: boolean;
  autoLockMinutes: number;
  setupPIN: (pin: string) => Promise<void>;
  removePIN: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  checkPIN: () => Promise<boolean>;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);
  const [autoLockMinutes, setAutoLockState] = useState(DEFAULT_AUTO_LOCK_MINUTES);
  const backgroundedAt = useRef<number | null>(null);
  const hasPINRef = useRef(false);
  const autoLockRef = useRef(DEFAULT_AUTO_LOCK_MINUTES);

  const checkPIN = useCallback(async (): Promise<boolean> => {
    const pin = await SecureStore.getItemAsync(PIN_KEY);
    const has = !!pin;
    setHasPIN(has);
    hasPINRef.current = has;
    return has;
  }, []);

  useEffect(() => {
    checkPIN().then(has => setIsLocked(has));
    SecureStore.getItemAsync(AUTO_LOCK_KEY).then(v => {
      const m = v ? parseInt(v, 10) : DEFAULT_AUTO_LOCK_MINUTES;
      if (!Number.isNaN(m)) {
        setAutoLockState(m);
        autoLockRef.current = m;
      }
    });
  }, [checkPIN]);

  // Uygulama arka plana geçtikten autoLockMinutes dakika sonra dönüşte kilitle.
  // (0 = hemen kilitle, -1 = otomatik kilit kapalı)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
      } else if (state === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        const minutes = autoLockRef.current;
        if (!hasPINRef.current || since === null || minutes < 0) return;
        const elapsedMs = Date.now() - since;
        if (elapsedMs >= minutes * 60 * 1000) setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const setupPIN = useCallback(async (pin: string) => {
    const salt = randomSalt();
    const hash = await hashPin(pin, salt);
    await SecureStore.setItemAsync(PIN_KEY, `v1:${salt}:${hash}`);
    setHasPIN(true);
    hasPINRef.current = true;
    setIsLocked(false);
  }, []);

  const removePIN = useCallback(async () => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setHasPIN(false);
    hasPINRef.current = false;
    setIsLocked(false);
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    if (!stored) return false;

    if (stored.startsWith('v1:')) {
      const [, salt, hash] = stored.split(':');
      const candidate = await hashPin(pin, salt);
      if (candidate === hash) {
        setIsLocked(false);
        return true;
      }
      return false;
    }

    // Eski sürümden kalan düz metin PIN: doğruysa hash'lenmiş formata yükselt
    if (stored === pin) {
      const salt = randomSalt();
      const hash = await hashPin(pin, salt);
      await SecureStore.setItemAsync(PIN_KEY, `v1:${salt}:${hash}`);
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const setAutoLockMinutes = useCallback(async (minutes: number) => {
    setAutoLockState(minutes);
    autoLockRef.current = minutes;
    await SecureStore.setItemAsync(AUTO_LOCK_KEY, String(minutes));
  }, []);

  return (
    <AuthContext.Provider value={{ isLocked, hasPIN, autoLockMinutes, setupPIN, removePIN, unlock, lock, checkPIN, setAutoLockMinutes }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
