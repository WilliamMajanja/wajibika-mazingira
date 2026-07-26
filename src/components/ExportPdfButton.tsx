import { useI18n } from '../config/i18n';
import type { Assessment } from '../types';

export default function ExportPdfButton({ assessment, onExport }: { assessment: Assessment; onExport: () => void }) {
  const { t } = useI18n();
  void assessment;

  return (
    <button onClick={onExport} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">{t('locker.exportPdf')}</button>
  );
}
