import * as React from 'react';
import { Card } from './common/Card';
import { useI18n } from '../config/i18n';

const PolicySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

export const PrivacyPolicy: React.FC = () => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-green-900 via-brand-green-800 to-blue-900 text-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold">{t('privacy.title')}</h1>
        <p className="text-brand-green-200 mt-2">{t('privacy.subtitle')}</p>
        <p className="text-xs text-brand-green-300 mt-2">{t('privacy.lastUpdated', String(currentYear))}</p>
      </div>

      <Card>
        <div className="p-6">
          <PolicySection title={t('privacy.intro.title')}>
            <p>{t('privacy.intro.line1')}</p>
            <p>{t('privacy.intro.line2')}</p>
          </PolicySection>

          <PolicySection title={t('privacy.data.title')}>
            <p>{t('privacy.data.line1')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.data.item1')}</li>
              <li>{t('privacy.data.item2')}</li>
              <li>{t('privacy.data.item3')}</li>
              <li>{t('privacy.data.item4')}</li>
            </ul>
          </PolicySection>

          <PolicySection title={t('privacy.local.title')}>
            <p>{t('privacy.local.line1')}</p>
            <p>{t('privacy.local.line2')}</p>
          </PolicySection>

          <PolicySection title={t('privacy.ai.title')}>
            <p>{t('privacy.ai.line1')}</p>
            <p>{t('privacy.ai.line2')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.ai.item1')}</li>
              <li>{t('privacy.ai.item2')}</li>
              <li>{t('privacy.ai.item3')}</li>
            </ul>
          </PolicySection>

          <PolicySection title={t('privacy.third.title')}>
            <p>{t('privacy.third.line1')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.third.item1')}</li>
              <li>{t('privacy.third.item2')}</li>
              <li>{t('privacy.third.item3')}</li>
            </ul>
            <p className="mt-2">{t('privacy.third.line2')}</p>
          </PolicySection>

          <PolicySection title={t('privacy.security.title')}>
            <p>{t('privacy.security.line1')}</p>
            <p>{t('privacy.security.line2')}</p>
          </PolicySection>

          <PolicySection title={t('privacy.rights.title')}>
            <p>{t('privacy.rights.line1')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('privacy.rights.item1')}</li>
              <li>{t('privacy.rights.item2')}</li>
              <li>{t('privacy.rights.item3')}</li>
              <li>{t('privacy.rights.item4')}</li>
            </ul>
          </PolicySection>

          <PolicySection title={t('privacy.changes.title')}>
            <p>{t('privacy.changes.line1')}</p>
          </PolicySection>

          <PolicySection title={t('privacy.contact.title')}>
            <p>{t('privacy.contact.line1')}</p>
            <div className="mt-2 p-4 bg-slate-50 rounded-lg text-sm">
              <p><strong>Wajibika Mazingira</strong></p>
              <p>William Majanja</p>
              <a href="https://github.com/WilliamMajanja" target="_blank" rel="noopener noreferrer" className="text-brand-green-600 hover:text-brand-green-800">github.com/WilliamMajanja</a>
            </div>
          </PolicySection>
        </div>
      </Card>
    </div>
  );
};