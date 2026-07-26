import * as React from 'react';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { EmptyState } from './common/EmptyState';
import { FormField } from './common/FormField';
import { useFieldErrors } from '../hooks/useFieldErrors';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { useStreamReader } from '../hooks/useStreamReader';
import {
  CarbonProject, CarbonProjectType, CarbonCredit, CarbonMetrics, CarbonPortfolio,
} from '../types';
import ProjectCard from './ProjectCard';
import { projectTypes } from '../constants/projectTypes';
import { streamAIResponse } from '../services/aiClient';
import { CARBON_EXPERT_INSTRUCTION, withLanguage } from '../config/ai';
import { useI18n } from '../config/i18n';
const CarbonAnalysisPanel = React.lazy(() => import('./CarbonAnalysisPanel').then(m => ({ default: m.default })));


function calcYears(startDate: string): number {
  return Math.max(1, (Date.now() - new Date(startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function calcProjectCredits(p: CarbonProject): number {
  return Math.round(p.areaHectares * p.carbonSequestrationRate * calcYears(p.startDate) * 100) / 100;
}

function genSerial(projectId: string, vintage: number, index: number): string {
  return `CBT-${vintage}-${projectId.slice(0, 6).toUpperCase()}-${String(index).padStart(4, '0')}`;
}



const initialForm = (): Partial<CarbonProject> => ({
  name: '', description: '', location: '',
  projectType: 'reforestation', areaHectares: 10,
  carbonSequestrationRate: 12, startDate: new Date().toISOString().split('T')[0],
  sdgContributions: [],
});

export const CarbonDashboard: React.FC = () => {
  const [projects, setProjects] = useLocalStorage<CarbonProject[]>('carbonProjects', []);
  const [credits, setCredits] = useLocalStorage<CarbonCredit[]>('carbonCredits', []);
  const [metrics, setMetrics] = useLocalStorage<CarbonMetrics>('carbonMetrics', {
    totalProjects: 0, activeProjects: 0, totalCreditsIssued: 0, totalCreditsRetired: 0,
    currentAveragePrice: 12.50, priceChange24h: 2.4, totalAreaRestored: 0,
    totalTonnesSequestered: 0, priceHistory: [],
  });
  const [portfolio, setPortfolio] = useLocalStorage<CarbonPortfolio>('carbonPortfolio', {
    ownedCredits: [], stakedCredits: [], totalSequestered: 0, totalRetired: 0, governanceTokens: 0,
  });

  const [showForm, setShowForm] = useLocalStorage('carbonDashboardShowForm', false);
  const [formData, setFormData] = useLocalStorage<Partial<CarbonProject>>('carbonDashboardFormData', initialForm());
  const [sdgInput, setSdgInput] = React.useState('');
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analyzingProjectName, setAnalyzingProjectName] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [retireTarget, setRetireTarget] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const fieldErrors = useFieldErrors<{ name: string; location: string; area: string }>();
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();

  const handleMintGovernanceTokens = () => {
    const currentTokens = portfolio.governanceTokens || 0;
    const newTokens = currentTokens + 10;
    setPortfolio({ ...portfolio, governanceTokens: newTokens });
    addToast({ type: 'success', message: `Governance tokens minted: +10 (Total: ${newTokens})` });
  };

  React.useEffect(() => {
    const totalSeq = projects.reduce((s, p) => s + p.totalTonnesSequestered, 0);
    const totalArea = projects.reduce((s, p) => s + p.areaHectares, 0);
    const active = projects.filter(p => p.status === 'active' || p.status === 'verified').length;
    const issued = credits.reduce((s, c) => s + c.tonnesCO2, 0);
    const retired = credits.filter(c => c.status === 'retired').reduce((s, c) => s + c.tonnesCO2, 0);
    const priced = credits.filter(c => c.status === 'available' || c.status === 'listed');

    setMetrics(prev => {
      const avgPrice = priced.length > 0
        ? Math.round(priced.reduce((s, c) => s + c.pricePerTonne, 0) / priced.length * 100) / 100
        : prev.currentAveragePrice;
      return {
        totalProjects: projects.length,
        activeProjects: active,
        totalCreditsIssued: Math.round(issued * 100) / 100,
        totalCreditsRetired: Math.round(retired * 100) / 100,
        currentAveragePrice: avgPrice,
        priceChange24h: prev.priceChange24h,
        totalAreaRestored: totalArea,
        totalTonnesSequestered: Math.round(totalSeq * 100) / 100,
        priceHistory: prev.priceHistory,
      };
    });
    setPortfolio(prev => ({ ...prev, totalSequestered: totalSeq }));
  }, [projects, credits, setMetrics, setPortfolio]);

  const handleCreateProject = () => {
    fieldErrors.clearAll();
    let valid = true;
    if (!formData.name?.trim()) { fieldErrors.setError('name', 'Project name is required.'); valid = false; }
    if (!formData.location?.trim()) { fieldErrors.setError('location', 'Location is required.'); valid = false; }
    if (!formData.areaHectares || formData.areaHectares <= 0) { fieldErrors.setError('area', 'Area must be greater than 0.'); valid = false; }
    if (!valid) { addToast({ type: 'error', message: 'Please fix the errors below.' }); return; }

    setIsCreating(true);
    // Simulate async for UX feedback
    setTimeout(() => {
      const id = `CP-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
      const rate = formData.carbonSequestrationRate || projectTypes.find(p => p.value === formData.projectType)?.rate || 6;
      const newProject: CarbonProject = {
        id, name: formData.name!.trim(), description: formData.description?.trim() || '',
        location: formData.location!.trim(),
        projectType: formData.projectType as CarbonProjectType,
        areaHectares: formData.areaHectares || 10, carbonSequestrationRate: rate,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        status: 'pending', totalCreditsIssued: 0, creditsAvailable: 0,
        sdgContributions: formData.sdgContributions || [], totalTonnesSequestered: 0,
      };
      setProjects([newProject, ...projects]);
      setShowForm(false);
      setFormData(initialForm());
      setIsCreating(false);
      addToast({ type: 'success', message: `Project "${newProject.name}" created.` });
    }, 300);
  };

  const handleActivateProject = (id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const total = calcProjectCredits(p);
      const num = Math.min(Math.floor(total), 100);
      const vintage = new Date(p.startDate).getFullYear();
      const newCredits: CarbonCredit[] = Array.from({ length: num }, (_, i) => ({
        id: `CC-${Date.now().toString(36)}-${i}`.toUpperCase(),
        projectId: p.id, projectName: p.name, projectType: p.projectType,
        vintage, tonnesCO2: 1, pricePerTonne: 12.50, status: 'available' as const,
        serialNumber: genSerial(p.id, vintage, i), certificationStandard: 'Plan Vivo',
        issuanceDate: new Date().toISOString(),
      }));
      setCredits(prev => [...newCredits, ...prev]);
      return { ...p, status: 'active' as const, totalCreditsIssued: total, creditsAvailable: num, totalTonnesSequestered: total };
    }));
    addToast({ type: 'success', message: 'Project activated and credits issued.' });
  };

  const handleVerifyProject = (id: string) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'verified' as const, lastVerificationDate: new Date().toISOString() } : p
    ));
    addToast({ type: 'success', message: 'Verification updated.' });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setProjects(prev => prev.filter(p => p.id !== deleteTarget));
    setCredits(prev => prev.filter(c => c.projectId !== deleteTarget));
    setDeleteTarget(null);
    addToast({ type: 'info', message: 'Project and its credits removed.' });
  };

  const handleConfirmRetire = (reason?: string) => {
    if (!retireTarget || !reason?.trim()) return;
    setCredits(prev => prev.map(c =>
      c.id === retireTarget ? {
        ...c, status: 'retired' as const, retirementDate: new Date().toISOString(),
        retiree: 'Community Member', retirementReason: reason.trim(),
      } : c
    ));
    setPortfolio(prev => ({ ...prev, totalRetired: prev.totalRetired + 1 }));
    setRetireTarget(null);
    addToast({ type: 'success', message: 'Carbon credit retired permanently.' });
  };

  const lastAnalyzedProject = React.useRef<CarbonProject | null>(null);

  const handleAnalyzeProject = async (project: CarbonProject) => {
    setIsAnalyzing(true);
    setAnalyzingProjectName(project.name);
    setAiAnalysis(null);
    setAiError(null);
    lastAnalyzedProject.current = project;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: `Analyze the carbon sequestration potential of this conservation project:\nName: ${project.name}\nLocation: ${project.location}\nType: ${project.projectType}\nArea: ${project.areaHectares} ha\nSequestration Rate: ${project.carbonSequestrationRate} tCO2e/ha/yr\nMethodology: ${project.methodology || 'Not specified'}\nStatus: ${project.status}\n\nProvide: 1. Estimated potential over 10 and 30 years 2. Recommended standards (VCS, Gold Standard, Plan Vivo) 3. Risk assessment (leakage, permanence, additionality) 4. MRV recommendations 5. Estimated credit value at market prices` }],
        systemInstruction: withLanguage(CARBON_EXPERT_INSTRUCTION, language),
      });
      let fullText = '';
      await readStream(stream, chunk => {
        fullText += chunk;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setAiAnalysis(fullText), 50);
      }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });
      if (timeoutId) clearTimeout(timeoutId);
      setAiAnalysis(fullText);
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      setAiError(e instanceof Error ? e.message : 'AI analysis failed.');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingProjectName(null);
    }
  };

  const handleRetryAnalysis = () => {
    if (lastAnalyzedProject.current) handleAnalyzeProject(lastAnalyzedProject.current);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.totalProjects')}</p><p className="text-2xl font-bold text-brand-green-700">{metrics.totalProjects}</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.creditsIssued')}</p><p className="text-2xl font-bold text-brand-green-700">{metrics.totalCreditsIssued} tCO₂</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.creditsRetired')}</p><p className="text-2xl font-bold text-blue-700">{metrics.totalCreditsRetired} tCO₂</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.avgPrice')}</p><p className="text-2xl font-bold text-amber-700">${metrics.currentAveragePrice}/t</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.areaRestored')}</p><p className="text-xl font-bold text-brand-green-700">{metrics.totalAreaRestored} ha</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.totalSequestered')}</p><p className="text-xl font-bold text-brand-green-700">{metrics.totalTonnesSequestered} tCO₂</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.governanceTokens')}</p><p className="text-xl font-bold text-purple-700">{portfolio.governanceTokens}</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('carbon.priceChange')}</p><p className={`text-xl font-bold ${metrics.priceChange24h >= 0 ? 'text-green-700' : 'text-red-700'}`}>{metrics.priceChange24h >= 0 ? '+' : ''}{metrics.priceChange24h}%</p></div></Card>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={handleMintGovernanceTokens}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
          {t('carbon.mintGovernanceTokens')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t('carbon.title')}</h2>
              <button onClick={() => setShowForm(!showForm)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                {showForm ? t('common.cancel') : t('carbon.newProject')}
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {showForm && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-700">{t('carbon.register.title')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label={t('carbon.project.name')} htmlFor="cp-name" required error={fieldErrors.errors.name}>
                      <input id="cp-name" type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} onBlur={() => { fieldErrors.markTouched('name'); if (!formData.name?.trim()) fieldErrors.setError('name', 'Project name is required.'); else fieldErrors.clearError('name'); }} maxLength={100} className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px] ${fieldErrors.errors.name ? 'border-red-500' : 'border-slate-300'}`} aria-describedby={fieldErrors.errors.name ? 'cp-name-error' : undefined} />
                    </FormField>
                    <FormField label={t('carbon.project.location')} htmlFor="cp-location" required error={fieldErrors.errors.location}>
                      <input id="cp-location" type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} onBlur={() => { fieldErrors.markTouched('location'); if (!formData.location?.trim()) fieldErrors.setError('location', 'Location is required.'); else fieldErrors.clearError('location'); }} maxLength={100} className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px] ${fieldErrors.errors.location ? 'border-red-500' : 'border-slate-300'}`} aria-describedby={fieldErrors.errors.location ? 'cp-location-error' : undefined} />
                    </FormField>
                    <FormField label={t('carbon.project.type')} htmlFor="cp-type">
                      <select id="cp-type" value={formData.projectType} onChange={e => {
                        const pt = e.target.value as CarbonProjectType;
                        setFormData({ ...formData, projectType: pt, carbonSequestrationRate: projectTypes.find(p => p.value === pt)?.rate || 6 });
                      }} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px]">
                        {projectTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.icon} {pt.label}</option>)}
                      </select>
                    </FormField>
                    <FormField label={t('carbon.project.area')} htmlFor="cp-area" required error={fieldErrors.errors.area}>
                      <input id="cp-area" type="number" value={formData.areaHectares || ''} onChange={e => setFormData({ ...formData, areaHectares: Math.max(0.1, Number(e.target.value)) })} onBlur={() => { fieldErrors.markTouched('area'); if (!formData.areaHectares || formData.areaHectares <= 0) fieldErrors.setError('area', 'Area must be greater than 0.'); else fieldErrors.clearError('area'); }} min="0.1" step="0.1" className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px] ${fieldErrors.errors.area ? 'border-red-500' : 'border-slate-300'}`} aria-describedby={fieldErrors.errors.area ? 'cp-area-error' : undefined} />
                    </FormField>
                    <FormField label={t('carbon.project.rate')} htmlFor="cp-rate">
                      <input id="cp-rate" type="number" value={formData.carbonSequestrationRate || ''} onChange={e => setFormData({ ...formData, carbonSequestrationRate: Math.max(0.1, Number(e.target.value)) })} min="0.1" step="0.1" className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px]" />
                    </FormField>
                    <FormField label={t('carbon.project.startDate')} htmlFor="cp-date">
                      <input id="cp-date" type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px]" />
                    </FormField>
                  </div>
                  <div>
                    <label htmlFor="cp-desc" className="block text-xs font-medium text-slate-600 mb-1">{t('carbon.project.description')}</label>
                    <textarea id="cp-desc" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} maxLength={500} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{t('carbon.project.sdg')}</label>
                    <div className="flex flex-wrap gap-1 mb-1" aria-live="polite">
                      {formData.sdgContributions?.map(s => <span key={s} className="px-2 py-0.5 text-xs bg-brand-green-100 text-brand-green-800 rounded-full">{s}</span>)}
                    </div>
                    <input type="text" value={sdgInput}
                      onChange={e => setSdgInput(e.target.value.replace(/[<>]/g, ''))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && sdgInput.trim()) {
                          e.preventDefault();
                          setFormData({ ...formData, sdgContributions: [...(formData.sdgContributions || []), sdgInput.trim()] });
                          setSdgInput('');
                        }
                      }}
                      placeholder={t('carbon.project.sdgPlaceholder')}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                  <button onClick={handleCreateProject} disabled={isCreating || !formData.name?.trim() || !formData.location?.trim() || !formData.areaHectares || formData.areaHectares <= 0}
                    className="w-full py-2 text-sm font-bold text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px] flex items-center justify-center gap-2">
                    {isCreating && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    {isCreating ? t('carbon.toast.creating') : t('carbon.project.register')}
                  </button>
                </div>
              )}
              {projects.length === 0 ? (
                <EmptyState
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>}
                  title={t('carbon.empty.title')}
                  description={t('carbon.empty.desc')}
                  actionLabel={t('carbon.newProject')}
                  onAction={() => setShowForm(true)}
                />
              ) : (
                <React.Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading projects…</div>}>
                  {projects.map(p => (
                    <ProjectCard key={p.id} project={p} onActivate={handleActivateProject} onVerify={handleVerifyProject} onAnalyze={handleAnalyzeProject} onDelete={setDeleteTarget} />
                  ))}
                </React.Suspense>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('carbon.recentCredits')}</h3></div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {credits.length === 0 ? (
                <p className="p-3 text-xs text-slate-500 text-center" role="status">{t('common.noData')}</p>
              ) : credits.slice(0, 10).map(c => (
                <div key={c.id} className="p-3 flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{c.serialNumber}</p>
                    <p className="text-xs text-slate-500 truncate">{c.projectName} · {c.vintage}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      c.status === 'available' ? 'bg-green-100 text-green-700' :
                      c.status === 'listed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>{c.status}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-800">{c.tonnesCO2} tCO₂</p>
                    <p className="text-xs text-slate-500">${c.pricePerTonne}/t</p>
                    {c.status !== 'retired' && (
                      <button onClick={() => setRetireTarget(c.id)} className="text-xs text-red-600 hover:underline mt-1">{t('carbon.retire')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <React.Suspense fallback={<div className="p-3 text-sm text-slate-500">Loading analysis…</div>}>
            <CarbonAnalysisPanel isAnalyzing={isAnalyzing} aiAnalysis={aiAnalysis} aiError={aiError} onRetry={handleRetryAnalysis} analyzingProjectName={analyzingProjectName} t={t} />
          </React.Suspense>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('carbon.delete.title')}
        message={t('carbon.delete.message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!retireTarget}
        title={t('carbon.retire.title')}
        message={t('carbon.retire.message')}
        confirmLabel="Retire"
        variant="danger"
        inputLabel={t('carbon.retire.reason')}
        inputPlaceholder={t('carbon.retire.placeholder')}
        onConfirm={handleConfirmRetire}
        onCancel={() => setRetireTarget(null)}
      />
    </div>
  );
};
