import * as React from 'react';
import { useI18n } from '../config/i18n';
import type { Page } from '../types';

interface FooterProps {
  onNavigate?: (page: Page) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  const handlePrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('privacy' as Page);
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            <p>
              &copy; {currentYear} Wajibika Mazingira &mdash; minima PiNet OS {t('footer.by')}{' '}
              <a
                href="https://github.com/WilliamMajanja"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-green-600 hover:text-brand-green-800 font-medium"
              >
                William Majanja
              </a>
            </p>
            <p className="text-xs text-slate-400 mt-1">{t('footer.tagline')}</p>
          </div>
          <nav className="flex items-center gap-4 text-xs text-slate-500" aria-label="Footer navigation">
            <a href="#privacy" onClick={handlePrivacy} className="hover:text-brand-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px] min-w-[32px] flex items-center justify-center">
              {t('footer.privacy')}
            </a>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <a href="https://github.com/WilliamMajanja/wajibika-mazingira" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px] min-w-[32px] flex items-center justify-center">
              {t('footer.github')}
            </a>
            <span className="text-slate-300" aria-hidden="true">|</span>
            <a href="https://github.com/WilliamMajanja/wajibika-mazingira/issues" target="_blank" rel="noopener noreferrer" className="hover:text-brand-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px] min-w-[32px] flex items-center justify-center">
              {t('footer.support')}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
