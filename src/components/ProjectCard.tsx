import * as React from 'react';
import { useI18n } from '../config/i18n';
import { CarbonProject } from '../types';
import { projectTypes } from '../constants/projectTypes';

const statusBadge = (s: CarbonProject['status']) => {
  const map: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-slate-100 text-slate-600',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  return map[s] || 'bg-slate-100 text-slate-600';
};

interface ProjectCardProps {
  project: CarbonProject;
  onActivate: (id: string) => void;
  onVerify: (id: string) => void;
  onAnalyze: (p: CarbonProject) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, onActivate, onVerify, onAnalyze, onDelete }) => {
  const { t } = useI18n();
  const pType = projectTypes.find(t => t.value === project.projectType);
  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">{pType?.icon || '🌍'}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{project.name}</h3>
            <p className="text-xs text-slate-500 truncate">{project.location} · {pType?.label}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${statusBadge(project.status)}`}>
          {project.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div><span className="text-slate-500">Area</span><p className="font-semibold">{project.areaHectares} ha</p></div>
        <div><span className="text-slate-500">Rate</span><p className="font-semibold">{project.carbonSequestrationRate} tCO₂/ha/yr</p></div>
        <div><span className="text-slate-500">Sequestered</span><p className="font-semibold">{Math.round(project.totalTonnesSequestered)} tCO₂</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {project.status === 'pending' && (
          <button onClick={() => onActivate(project.id)}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
            {t('carbon.activate')}
          </button>
        )}
        {project.status === 'active' && (
          <button onClick={() => onVerify(project.id)}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {t('carbon.verify')}
          </button>
        )}
        <button onClick={() => onAnalyze(project)}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400">
          {t('carbon.analyze')}
        </button>
        <button onClick={() => onDelete(project.id)}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400">
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
});

export default ProjectCard;
