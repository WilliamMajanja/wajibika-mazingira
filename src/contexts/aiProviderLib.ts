import * as React from 'react';
import { type AiProvider, type AiProviderConfig, createProvider } from '../services/aiProvider';

interface AiProviderState {
  config: AiProviderConfig;
  provider: AiProvider;
  updateConfig: (config: AiProviderConfig) => void;
}

const STORAGE_KEY = 'aiProviderConfig';

const defaultConfig: AiProviderConfig = {
  type: 'local',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1:latest',
  openRouterKey: '',
  openRouterModel: 'deepseek/deepseek-v4-flash-free',
  qvacUrl: 'http://localhost:11434',
  qvacModel: 'phi3:mini',
  qvacApiKey: '',
};

const AiProviderCtx = React.createContext<AiProviderState | undefined>(undefined);

function loadConfig(): AiProviderConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
        return { ...defaultConfig, ...parsed };
      }
    }
  } catch (error) {
    console.error('[AiProvider] Error loading config from localStorage:', error);
  }
  return defaultConfig;
}

export function getProvider(): AiProvider {
  return createProvider(loadConfig());
}

export function useAiProvider(): AiProviderState {
  const ctx = React.useContext(AiProviderCtx);
  if (!ctx) throw new Error('useAiProvider must be used within AiProviderContext');
  return ctx;
}

export { defaultConfig, AiProviderCtx, loadConfig };
export type { AiProviderState };
