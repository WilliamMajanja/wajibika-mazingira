import { useState, useEffect, Dispatch, SetStateAction } from 'react';

const STORAGE_WARNING_KEY = 'storageWarningShown';
const STORAGE_WARNING_INTERVAL = 60000;

function showStorageWarning() {
  const lastShown = parseInt(localStorage.getItem(STORAGE_WARNING_KEY) || '0', 10);
  if (Date.now() - lastShown < STORAGE_WARNING_INTERVAL) return;
  localStorage.setItem(STORAGE_WARNING_KEY, String(Date.now()));

  const event = new CustomEvent('storage-quota-warning', {
    detail: {
      message: 'Storage is nearly full. Consider exporting or removing old data to free up space.',
    },
  });
  window.dispatchEvent(event);
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      const valueToStore = JSON.stringify(storedValue);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        showStorageWarning();
      } else {
        console.error(`[useLocalStorage] Error writing key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        const newValue = JSON.parse(e.newValue) as T;
        setStoredValue(newValue);
      } catch (error) {
        console.error(`[useLocalStorage] Error parsing storage event for key "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setStoredValue];
}

// Hook to listen for storage quota warnings
export function useStorageWarning(callback: (message: string) => void) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail.message);
    };
    window.addEventListener('storage-quota-warning', handler);
    return () => window.removeEventListener('storage-quota-warning', handler);
  }, [callback]);
}
