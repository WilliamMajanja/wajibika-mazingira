import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ExpandableContent } from './common/ExpandableContent';

interface CarbonAnalysisPanelProps {
  isAnalyzing: boolean;
  aiAnalysis: string | null;
  aiError: string | null;
  onRetry?: () => void;
  analyzingProjectName?: string | null;
  t: (key: string) => string;
}

export default function CarbonAnalysisPanel({ isAnalyzing, aiAnalysis, aiError, onRetry, analyzingProjectName, t }: CarbonAnalysisPanelProps) {
  return (
    <Card>
      <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('carbon.analysis.title')}</h3></div>
      <div className="p-3 max-h-48 overflow-y-auto text-sm text-slate-600" role="status" aria-live="polite">
        {isAnalyzing ? (
          <LoadingSpinner size="sm" message={analyzingProjectName ? `${t('carbon.analysis.analyzing')} "${analyzingProjectName}"...` : t('carbon.analysis.analyzing')} />
        ) : aiError ? (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-red-700 text-sm">{aiError}</p>
            {onRetry && (
              <button onClick={onRetry} className="mt-2 text-xs font-semibold text-brand-green-600 hover:text-brand-green-800 focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px]">
                {t('common.retry') || 'Retry'}
              </button>
            )}
          </div>
        ) : aiAnalysis ? (
          <ExpandableContent content={aiAnalysis} maxLength={500} />
        ) : (
          <p className="text-slate-400 italic">{t('carbon.analysis.empty')}</p>
        )}
      </div>
    </Card>
  );
}
