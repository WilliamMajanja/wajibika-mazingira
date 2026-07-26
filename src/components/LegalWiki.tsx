import * as React from 'react';
import { Card } from './common/Card';
import { useI18n } from '../config/i18n';
import { ZANZIBAR_LAWS, LAW_CATEGORIES, ZEMA_LINKS } from '../data/laws';
import type { LegalAct, LegalCategory } from '../types';

const categoryIcons: Record<LegalCategory, string> = {
  environmental: '\u{1F331}',
  land: '\u{1F3D7}',
  water: '\u{1F30A}',
  energy: '\u{26A1}',
  planning: '\u{1F3D8}',
  regulations: '\u{1F4C4}',
};

function ActDetailView({ act, onBack }: { act: LegalAct; onBack: () => void }) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-brand-green-600 hover:text-brand-green-800 font-semibold transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t('legal.backToIndex')}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-green-900 to-brand-green-800 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{categoryIcons[act.category]}</span>
            <div>
              <p className="text-green-200 text-sm font-semibold">{act.category.charAt(0).toUpperCase() + act.category.slice(1)}</p>
              <h3 className="text-xl font-bold text-white">{act.title}</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{t('legal.year')}: {act.year}</span>
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{act.actNumber}</span>
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{act.enforcingAgency}</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <p className="text-slate-700 leading-relaxed">{act.description}</p>

          {act.penalties && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-bold text-red-800 mb-2">{t('legal.penalties')}</h4>
              <p className="text-red-700 text-sm leading-relaxed">{act.penalties}</p>
            </div>
          )}

          {act.parts.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-lg mb-3">{t('legal.structure')}</h4>
              <div className="space-y-2">
                {act.parts.map((part, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <h5 className="font-semibold text-slate-800 text-sm">{part.title}</h5>
                    <p className="text-slate-600 text-sm mt-1">{part.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {act.keyProvisions.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-lg mb-3">{t('legal.keyProvisions')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">{t('legal.section')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">{t('legal.description')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {act.keyProvisions.map((prov, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-brand-green-700 font-semibold whitespace-nowrap">{prov.section}</td>
                        <td className="px-4 py-2 text-slate-700">
                          {prov.description}
                          {prov.penalty && <span className="block text-red-600 text-xs mt-1">{t('legal.penalty')}: {prov.penalty}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 font-semibold">{t('legal.dateEnacted')}: {act.dateEnacted}</span>
            {act.dateCommenced && <span className="text-xs text-slate-500 font-semibold">{t('legal.dateCommenced')}: {act.dateCommenced}</span>}
            <span className="text-xs text-slate-500 font-semibold">{t('legal.jurisdiction')}: {act.jurisdiction}</span>
          </div>

          {act.relatedLaws.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-semibold text-slate-700 text-sm mb-2">{t('legal.relatedLaws')}</h4>
              <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                {act.relatedLaws.map((law, i) => <li key={i}>{law}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActCard({ act, onSelect }: { act: LegalAct; onSelect: (id: string) => void }) {
  const { t } = useI18n();
  const statusColors: Record<string, string> = {
    in_force: 'bg-green-100 text-green-700',
    repealed: 'bg-red-100 text-red-700',
    amended: 'bg-amber-100 text-amber-700',
  };

  return (
    <div onClick={() => onSelect(act.id)} className="cursor-pointer">
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-1">{categoryIcons[act.category]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-slate-900 text-base">{act.shortTitle}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[act.status]}`}>
                  {t(`legal.status.${act.status}`)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {act.actNumber} | {t('legal.year')}: {act.year} | {t('legal.enforcedBy')}: {act.enforcingAgency.split('—')[0].trim()}
              </p>
              <p className="text-sm text-slate-600 line-clamp-2">{act.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-brand-green-600 font-semibold">{t('legal.viewDetails')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function LegalWiki() {
  const { t } = useI18n();
  const [selectedAct, setSelectedAct] = React.useState<string | null>(null);
  const [filterCategory, setFilterCategory] = React.useState<LegalCategory | 'all'>('all');

  const filteredLaws = filterCategory === 'all'
    ? ZANZIBAR_LAWS
    : ZANZIBAR_LAWS.filter(l => l.category === filterCategory);

  const selected = selectedAct ? ZANZIBAR_LAWS.find(l => l.id === selectedAct) : null;

  if (selected) {
    return <ActDetailView act={selected} onBack={() => setSelectedAct(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-green-900 via-brand-green-800 to-brand-green-900 rounded-xl px-6 py-5 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{t('legal.title')}</h2>
        <p className="text-green-100 text-sm leading-relaxed">{t('legal.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filterCategory === 'all'
              ? 'bg-brand-green-600 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {t('legal.all')}
        </button>
        {LAW_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key as LegalCategory)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              filterCategory === cat.key
                ? 'bg-brand-green-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{categoryIcons[cat.key as LegalCategory]}</span>
            {t(cat.labelKey)}
          </button>
        ))}
      </div>

      {filteredLaws.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">{t('legal.noLaws')}</p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredLaws.map(act => (
          <ActCard key={act.id} act={act} onSelect={setSelectedAct} />
        ))}
      </div>

      <Card>
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-lg mb-3">{t('legal.resources')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {ZEMA_LINKS.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-sm font-semibold text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
