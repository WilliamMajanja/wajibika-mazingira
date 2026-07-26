import * as React from 'react';
import { Card } from './common/Card';
import { useAiProvider, defaultConfig } from '../contexts/aiProviderLib';
import { useToasts } from '../hooks/useToasts';
import { useI18n } from '../config/i18n';
import type { AiProviderConfig, AiProviderType } from '../services/aiProvider';

export const AiConfigPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { config, updateConfig } = useAiProvider();
  const { addToast } = useToasts();
  const [local, setLocal] = React.useState<AiProviderConfig>({ ...config });
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<'idle' | 'ok' | 'fail'>('idle');

  const handleSave = () => {
    updateConfig(local);
    addToast({ type: 'success', message: `${t('aiConfig.toast.saved')}: ${local.type === 'local' ? 'Local (Offline)' : local.type === 'ollama' ? t('aiConfig.ollama') : local.type === 'openrouter' ? t('aiConfig.openrouter') : t('aiConfig.qvac')}.` });
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('idle');
    try {
      if (local.type === 'ollama') {
        const url = (local.ollamaUrl || defaultConfig.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const models = (json.models || []).map((m: { name: string }) => m.name);
        const llama3Available = models.some((m: string) => m.includes('llama3'));
        addToast({ type: 'success', message: `${t('aiConfig.toast.ollamaConnected')} ${llama3Available ? 'llama3:latest available' : `Models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}` }` });
      } else if (local.type === 'openrouter') {
        if (!local.openRouterKey) throw new Error(t('aiConfig.toast.noKey'));
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${local.openRouterKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        addToast({ type: 'success', message: `${t('aiConfig.toast.openrouterConnected')} Credits: ${json.data?.credits || 'N/A'}` });
      } else if (local.type === 'qvac') {
        const url = (local.qvacUrl || defaultConfig.qvacUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const headers: Record<string, string> = {};
        if (local.qvacApiKey) {
          headers['Authorization'] = `Bearer ${local.qvacApiKey}`;
        }
        const res = await fetch(`${url}/v1/models`, {
          headers,
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}${res.status === 404 ? ' — QVAC server may not be running or on a different port' : ''}`);
        const json = await res.json();
        const modelList = (json.data || []).map((m: { id: string }) => m.id).join(', ');
        addToast({ type: 'success', message: `${t('aiConfig.toast.qvacConnected')} Models: ${modelList || 'none loaded'}` });
      } else {
        addToast({ type: 'info', message: 'Local (Offline) mode: no connection test needed. Ready to use.' });
        setTestResult('ok');
        setTesting(false);
        return;
      }
      setTestResult('ok');
    } catch (e: unknown) {
      setTestResult('fail');
      addToast({ type: 'error', message: `${t('aiConfig.toast.connectionFailed')}: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <Card>
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">{t('aiConfig.title')}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-600">{t('aiConfig.desc')}</p>

            {/* Provider Toggle */}
            <div className="flex gap-2">
              <button onClick={() => setLocal({ ...local, type: 'ollama' as AiProviderType })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${local.type === 'ollama' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span className="block text-lg mb-1">🦙</span>{t('aiConfig.ollama')}
              </button>
              <button onClick={() => setLocal({ ...local, type: 'openrouter' as AiProviderType })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${local.type === 'openrouter' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span className="block text-lg mb-1">🌐</span>{t('aiConfig.openrouter')}
              </button>
              <button onClick={() => setLocal({ ...local, type: 'qvac' as AiProviderType })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${local.type === 'qvac' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span className="block text-lg mb-1">⚡</span>{t('aiConfig.qvac')}
              </button>
              <button onClick={() => setLocal({ ...local, type: 'local' as AiProviderType })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${local.type === 'local' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <span className="block text-lg mb-1">📦</span>Local (Offline)
              </button>
            </div>

            {/* Ollama Settings */}
            {local.type === 'ollama' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-slate-700">{t('aiConfig.ollamaSettings')}</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.serverUrl')}</label>
                  <input type="text" value={local.ollamaUrl || defaultConfig.ollamaUrl}
                    onChange={e => setLocal({ ...local, ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.model')}</label>
                  <input type="text" value={local.ollamaModel || defaultConfig.ollamaModel}
                    onChange={e => setLocal({ ...local, ollamaModel: e.target.value })}
                    placeholder={t('aiConfig.modelPlaceholder.ollama')}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                  <p className="text-xs text-slate-400 mt-1">{t('aiConfig.modelHint.ollama')}</p>
                </div>
              </div>
            )}

            {/* OpenRouter Settings */}
            {local.type === 'openrouter' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-slate-700">{t('aiConfig.openrouterSettings')}</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.apiKey')}</label>
                  <input type="password" value={local.openRouterKey || ''}
                    onChange={e => setLocal({ ...local, openRouterKey: e.target.value })}
                    placeholder={t('aiConfig.apiKeyPlaceholder')}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                  <p className="text-xs text-slate-400 mt-1">{t('aiConfig.apiKeyHint')} <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-brand-green-600 hover:underline">openrouter.ai/keys</a></p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.model')}</label>
                  <input type="text" value={local.openRouterModel || defaultConfig.openRouterModel}
                    onChange={e => setLocal({ ...local, openRouterModel: e.target.value })}
                    placeholder={t('aiConfig.modelPlaceholder.openrouter')}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                  <p className="text-xs text-slate-400 mt-1">{t('aiConfig.modelHint.openrouter')}</p>
                </div>
              </div>
            )}

            {/* QVAC Settings */}
            {local.type === 'qvac' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-slate-700">{t('aiConfig.qvacSettings')}</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.serverUrl')}</label>
                  <input type="text" value={local.qvacUrl || defaultConfig.qvacUrl}
                    onChange={e => setLocal({ ...local, qvacUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.apiKey')}</label>
                  <input type="password" value={local.qvacApiKey || ''}
                    onChange={e => setLocal({ ...local, qvacApiKey: e.target.value })}
                    placeholder={t('aiConfig.apiKeyPlaceholder')}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                  <p className="text-xs text-slate-400 mt-1">Optional. Required if QVAC server uses <code>--api-key</code>.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('aiConfig.model')}</label>
                  <input type="text" value={local.qvacModel || defaultConfig.qvacModel}
                    onChange={e => setLocal({ ...local, qvacModel: e.target.value })}
                    placeholder="my-llm"
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
                  <p className="text-xs text-slate-400 mt-1">Must match a model name on your server (e.g. <code>phi3:mini</code>, <code>llama3:latest</code>).</p>
                </div>
              </div>
            )}

            {/* Local (Offline) Settings */}
            {local.type === 'local' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-slate-700">Local (Offline) Mode</h3>
                <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                  <strong>No AI service required.</strong> Uses built-in template responses for all analysis features. 
                  Works offline for demonstration and testing purposes. To use real AI, select Ollama, OpenRouter, or QVAC.
                </div>
              </div>
            )}

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              {testResult === 'ok' && <span className="text-xs text-green-600 font-semibold">✓ {t('aiConfig.connected')}</span>}
              {testResult === 'fail' && <span className="text-xs text-red-600 font-semibold">✗ {t('aiConfig.failed')}</span>}
            </div>

            <div className="flex gap-3">
              <button onClick={handleTest} disabled={testing}
                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
                {testing ? t('aiConfig.testing') : t('aiConfig.testConnection')}
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2 text-sm font-bold text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700">
                {t('aiConfig.save')}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
