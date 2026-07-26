import * as React from 'react';
import { useI18n } from '../../config/i18n';

interface ExpandableContentProps {
  content: string;
  maxLength?: number;
  className?: string;
}

export const ExpandableContent: React.FC<ExpandableContentProps> = ({
  content,
  maxLength = 500,
  className = '',
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isTruncatable = content.length > maxLength;
  const displayText = isTruncatable && !isExpanded ? content.slice(0, maxLength) : content;

  return (
    <div className={className}>
      <p className="whitespace-pre-line text-sm text-slate-600">
        {displayText}
        {isTruncatable && !isExpanded && <span className="text-slate-400">...</span>}
      </p>
      {isTruncatable && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-semibold text-brand-green-600 hover:text-brand-green-800 focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px] min-w-[32px]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? t('expandable.showLess') : t('expandable.showAll', String(content.length))}
        </button>
      )}
    </div>
  );
};
