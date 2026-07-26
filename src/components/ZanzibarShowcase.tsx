import * as React from 'react';
import { Card } from './common/Card';
import { getShowcaseLocales } from '../config/eac';
import { CarbonProjectType } from '../types';
import { useI18n } from '../config/i18n';

// Import Zanzibar showcase images
import ZanzibarHero from '../assets/zanzibar-hero.jpg';
import ZanzibarJozaniForest from '../assets/zanzibar-jozani-forest.jpg';
import ZanzibarMangroves from '../assets/zanzibar-mangroves.jpg';
import ZanzibarSeaweed from '../assets/zanzibar-seaweed.jpg';
import ZanzibarSolar from '../assets/zanzibar-solar.jpg';
import ZanzibarCoralReef from '../assets/zanzibar-coral-reef.jpg';

const ZONE_TRANSLATION_KEYS: Record<string, string> = {
  'Misitu ya Mikoko': 'zanzibar.zone.misitu-ya-mikoko',
  'Miamba ya Matumbawe': 'zanzibar.zone.miamba-ya-matumbawe',
  'Majani ya Bahari': 'zanzibar.zone.majani-ya-bahari',
  'Hifadhi ya Jozani': 'zanzibar.zone.hifadhi-ya-jozani',
  'Misitu ya Mvuli': 'zanzibar.zone.misitu-ya-mvuli',
  'Misitu ya Pwani': 'zanzibar.zone.misitu-ya-pwani',
  'Vishamba vya Mwani': 'zanzibar.zone.vishamba-vya-mwani',
};

const projectTypeIcons: Record<string, string> = {
  blue_carbon: '🌊',
  conservation: '🦁',
  agroforestry: '🌿',
  reforestation: '🌳',
  renewable_energy: '☀️',
  soil_carbon: '🌱',
  afforestation: '🌲',
  other: '🌍',
};

const SDG_KEYS: Record<string, string> = {
  'Life on Land': 'zanzibar.sdg.lifeOnLand',
  'Climate Action': 'zanzibar.sdg.climateAction',
  'Biodiversity Conservation': 'zanzibar.sdg.biodiversityConservation',
  'Life Below Water': 'zanzibar.sdg.lifeBelowWater',
  'Sustainable Communities': 'zanzibar.sdg.sustainableCommunities',
  'Gender Equality': 'zanzibar.sdg.genderEquality',
  'Affordable and Clean Energy': 'zanzibar.sdg.affordableCleanEnergy',
  'Innovation': 'zanzibar.sdg.innovation',
};

const showcaseProjects = [
  {
    id: 'showcase-znz-jozani',
    nameKey: 'zanzibar.project.jozani.name',
    locationKey: 'zanzibar.project.jozani.location',
    type: 'conservation' as CarbonProjectType,
    areaHectares: 5000,
    rate: 8,
    descKey: 'zanzibar.project.jozani.desc',
    sdg: ['Life on Land', 'Climate Action', 'Biodiversity Conservation'],
  },
  {
    id: 'showcase-znz-mangroves',
    nameKey: 'zanzibar.project.mangroves.name',
    locationKey: 'zanzibar.project.mangroves.location',
    type: 'blue_carbon' as CarbonProjectType,
    areaHectares: 12000,
    rate: 7,
    descKey: 'zanzibar.project.mangroves.desc',
    sdg: ['Life Below Water', 'Climate Action', 'Sustainable Communities'],
  },
  {
    id: 'showcase-znz-seaweed',
    nameKey: 'zanzibar.project.seaweed.name',
    locationKey: 'zanzibar.project.seaweed.location',
    type: 'blue_carbon' as CarbonProjectType,
    areaHectares: 3000,
    rate: 5,
    descKey: 'zanzibar.project.seaweed.desc',
    sdg: ['Gender Equality', 'Life Below Water', 'Climate Action'],
  },
  {
    id: 'showcase-znz-solar',
    nameKey: 'zanzibar.project.solar.name',
    locationKey: 'zanzibar.project.solar.location',
    type: 'renewable_energy' as CarbonProjectType,
    areaHectares: 500,
    rate: 4,
    descKey: 'zanzibar.project.solar.desc',
    sdg: ['Affordable and Clean Energy', 'Climate Action', 'Innovation'],
  },
  {
    id: 'showcase-znz-coral',
    nameKey: 'zanzibar.project.coral.name',
    locationKey: 'zanzibar.project.coral.location',
    type: 'conservation' as CarbonProjectType,
    areaHectares: 1500,
    rate: 3,
    descKey: 'zanzibar.project.coral.desc',
    sdg: ['Life Below Water', 'Climate Action', 'Biodiversity Conservation'],
  },
];

const showcaseStats = [
  { labelKey: 'zanzibar.stats.forestCover', valueKey: 'zanzibar.stats.forestCover.value', icon: '🌴' },
  { labelKey: 'zanzibar.stats.coralReefs', valueKey: 'zanzibar.stats.coralReefs.value', icon: '🪸' },
  { labelKey: 'zanzibar.stats.marineSpecies', valueKey: 'zanzibar.stats.marineSpecies.value', icon: '🐠' },
  { labelKey: 'zanzibar.stats.carbonPotential', valueKey: 'zanzibar.stats.carbonPotential.value', icon: '🌿' },
];

export const ZanzibarShowcase: React.FC = () => {
  const { t } = useI18n();
  const locales = getShowcaseLocales();

  return (
    <div className="space-y-8">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-900 via-brand-green-800 to-blue-900 text-white">
        <div className="absolute inset-0">
          <img 
            src={ZanzibarHero} 
            alt={t('zanzibar.hero.alt')}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🇹🇿</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{t('zanzibar.title')}</h1>
              <p className="text-brand-green-200 text-sm md:text-base mt-1">{t('zanzibar.country')} · {t('zanzibar.hero.eac')}</p>
            </div>
          </div>
          <p className="max-w-3xl text-brand-green-100 text-base md:text-lg leading-relaxed">
            {t('zanzibar.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showcaseStats.map(stat => (
          <Card key={stat.labelKey}>
            <div className="p-4 text-center">
              <span className="text-3xl block mb-2">{stat.icon}</span>
              <p className="text-2xl font-bold text-brand-green-700">{t(stat.valueKey)}</p>
              <p className="text-xs text-slate-500 mt-1">{t(stat.labelKey)}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Locales Map */}
      <Card>
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{t('zanzibar.projects')}</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locales.map(locale => (
              <div key={locale.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📍</span>
                  <h3 className="font-bold text-slate-700 text-sm">{locale.name}</h3>
                </div>
                {locale.showcaseDescription && (
                  <p className="text-xs text-slate-600 mb-3">{t(`zanzibar.locale.description.${locale.id}`, locale.showcaseDescription)}</p>
                )}
                <div className="space-y-1 text-xs text-slate-500">
                  <p><span className="font-semibold">{t('zanzibar.locale.biodiversity')}</span> {locale.biodiversityZones?.map(z => { const k = ZONE_TRANSLATION_KEYS[z]; return k ? t(k) : z; }).join(', ')}</p>
                  <p><span className="font-semibold">{t('zanzibar.locale.carbonTypes')}</span> {locale.carbonProjectTypes?.map(ct => projectTypeIcons[ct] || '🌍').join(' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Featured Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showcaseProjects.map((project, index) => {
          const projectImages = [
            ZanzibarJozaniForest,
            ZanzibarMangroves,
            ZanzibarSeaweed,
            ZanzibarSolar,
            ZanzibarCoralReef,
          ];
          const image = projectImages[index];
          
          return (
            <Card key={project.id}>
              <div className="p-5">
                <div className="relative mb-3">
                  <img 
                    src={image} 
                    alt={t('zanzibar.project.alt', t(project.nameKey))}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-video object-cover rounded-lg mb-3"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-lg">{projectTypeIcons[project.type] || '🌍'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t(project.nameKey)}</h3>
                  <p className="text-xs text-slate-500">{t(project.locationKey)}</p>
                </div>
                <p className="text-sm text-slate-600 mb-4">{t(project.descKey)}</p>
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-xs text-slate-500">{t('carbon.project.area')}</span>
                    <p className="font-semibold">{project.areaHectares.toLocaleString()} ha</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">{t('carbon.project.rate')}</span>
                    <p className="font-semibold">{project.rate} tCO₂/ha/yr</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">{t('zanzibar.project.type')}</span>
                    <p className="font-semibold capitalize">{project.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.sdg.map(s => (
                    <span key={s} className="px-2 py-0.5 text-xs bg-brand-green-100 text-brand-green-800 rounded-full">{t(SDG_KEYS[s] || s)}</span>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Companion Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{t('zanzibar.companion.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('zanzibar.companion.desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {[
            { key: 'landDeveloper', icon: '🏗️' },
            { key: 'communityReporter', icon: '📢' },
            { key: 'carbonWallet', icon: '💳' },
            { key: 'conservationMap', icon: '🗺️' },
          ].map(app => (
            <div key={app.key} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow bg-slate-50">
              <span className="text-3xl block mb-3">{app.icon}</span>
              <h3 className="font-bold text-slate-800 text-sm mb-1">{t(`zanzibar.companion.${app.key}.name`)}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t(`zanzibar.companion.${app.key}.desc`)}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">{t('zanzibar.companion.cta')}</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center p-8 bg-gradient-to-r from-brand-green-50 to-blue-50 rounded-2xl border border-brand-green-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-3">{t('zanzibar.cta.title')}</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-6">
          {t('zanzibar.cta.desc')}
        </p>
        <p className="text-sm text-slate-500">
          {t('zanzibar.cta.countries')}
        </p>
      </div>
    </div>
  );
};
