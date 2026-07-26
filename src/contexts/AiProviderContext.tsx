import * as React from 'react';
import { type AiProviderConfig, createProvider } from '../services/aiProvider';
import { AiProviderCtx, loadConfig } from './aiProviderLib';

export const AiProviderContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = React.useState<AiProviderConfig>(loadConfig);

  const provider = React.useMemo(() => createProvider(config), [config]);

  const updateConfig = React.useCallback((newConfig: AiProviderConfig) => {
    try {
      const STORAGE_KEY = 'aiProviderConfig';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('[AiProvider] Error saving config to localStorage:', error);
    }
    setConfig(newConfig);
  }, []);

  return (
    <AiProviderCtx.Provider value={{ config, provider, updateConfig }}>
      {children}
    </AiProviderCtx.Provider>
  );
};
