import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
