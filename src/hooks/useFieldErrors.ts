import * as React from 'react';

export function useFieldErrors<T extends Record<string, unknown>>(initialErrors: Partial<Record<keyof T, string>> = {}) {
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>(initialErrors);
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});

  const setError = React.useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = React.useCallback((field: keyof T) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const markTouched = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const clearAll = React.useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return { errors, touched, setError, clearError, markTouched, clearAll, hasErrors };
}
