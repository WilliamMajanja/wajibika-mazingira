import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Assessment } from '../types';
import { useI18n } from '../config/i18n';

export default function EvidenceListPanel({
  assessment,
  onAnalyze,
  onRemove,
  onAddClick,
  fileInputRef,
  onFileChange,
}: {
  assessment: Assessment;
  onAnalyze: (id: string) => void;
  onRemove: (id: string) => void;
  onAddClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{t('locker.evidence')}</h3>
      <div className="space-y-4">
        {assessment.evidence?.map(item => (
          <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
            <div className="flex flex-col md:flex-row gap-4">
              {item.type === 'image' ? (
                <img src={item.data} alt={item.name} loading="lazy" decoding="async" className="w-full md:w-48 h-auto object-cover rounded-md" />
              ) : (
                <div className="w-full md:w-48 max-h-48 overflow-y-auto p-3 bg-white rounded-md border border-slate-200 prose prose-sm max-w-none">
                  <ReactMarkdown>{item.data}</ReactMarkdown>
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <button onClick={() => onRemove(item.id)} aria-label={`${t('locker.evidence.remove')} ${item.name}`} className="text-xs text-red-500 hover:underline">{t('locker.evidence.remove')}</button>
                </div>
                <div className="mt-2 prose prose-sm max-w-none text-slate-600">
                  {item.analysis ? <ReactMarkdown>{item.analysis}</ReactMarkdown> : <p className="text-slate-500 italic">{t('locker.evidence.noAnalysis')}</p>}
                  {item.isAnalyzing && !item.analysis && <p className="text-slate-500">{t('locker.evidence.analyzing')}</p>}
                </div>
                {item.type === 'image' && (
                  <button onClick={() => onAnalyze(item.id)} disabled={item.isAnalyzing} className="mt-3 text-sm font-medium text-brand-green-600 hover:text-brand-green-800 disabled:opacity-50 disabled:cursor-wait">
                    {item.isAnalyzing ? t('locker.evidence.analyzing') : item.analysis ? t('locker.evidence.reanalyze') : t('locker.evidence.analyze')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <button onClick={onAddClick} aria-label={t('locker.evidence.add')} className="mt-4 w-full text-center py-2 px-4 border-2 border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400">{t('locker.evidence.add')}</button>
        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" aria-label={t('locker.evidence.add')} className="hidden" />
      </div>
    </div>
  );
}
