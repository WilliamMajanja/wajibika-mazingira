import * as React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Assessment, Evidence } from '../types';
import { Card } from './common/Card';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useI18n } from '../config/i18n';
// ReactMarkdown used in EvidenceListPanel; not required here
const EvidenceReportViewer = React.lazy(() => import('./EvidenceReportViewer'));
const EvidenceListPanel = React.lazy(() => import('./EvidenceListPanel').then(m => ({ default: m.default })));
import { useToasts } from '../hooks/useToasts';
import { useStreamReader } from '../hooks/useStreamReader';

import { MODELS } from '../config/ai';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_LABEL } from '../utils/sanitize';
import ExportPdfButton from './ExportPdfButton';

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);

export const EvidenceLocker: React.FC = () => {
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const [selectedAssessment, setSelectedAssessment] = React.useState<Assessment | null>(assessments[0] || null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedReport, setEditedReport] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'environmental' | 'social' | 'health' | 'climate' | 'carbon' | 'monitoring' | 'engagement' | 'compliance' | 'financial' | 'risk'>('all');
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();
  
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [editingResetKey, setEditingResetKey] = React.useState(selectedAssessment?.id);
  if (selectedAssessment?.id !== editingResetKey) {
    setEditingResetKey(selectedAssessment?.id);
    setIsEditing(false);
    setEditedReport('');
  }

  const assessmentsRef = React.useRef(assessments);
  React.useEffect(() => {
    assessmentsRef.current = assessments;
  }, [assessments]);

  const filteredAssessments = React.useMemo(() => {
    if (activeTab === 'all') return assessments;
    return assessments.filter(a => {
      const type = a.assessmentType.toLowerCase();
      switch (activeTab) {
        case 'environmental': return type.includes('environmental');
        case 'social': return type.includes('social');
        case 'health': return type.includes('health');
        case 'climate': return type.includes('climate');
        case 'carbon': return type.includes('carbon');
        case 'monitoring': return type.includes('monitoring');
        case 'engagement': return type.includes('engagement');
        case 'compliance': return type.includes('compliance');
        case 'financial': return type.includes('financial');
        case 'risk': return type.includes('risk');
        default: return true;
      }
    });
  }, [assessments, activeTab]);
  
  const updateAssessment = (updatedAssessment: Assessment) => {
      const updatedAssessments = assessments.map(a => a.id === updatedAssessment.id ? updatedAssessment : a);
      setAssessments(updatedAssessments);
      setSelectedAssessment(updatedAssessment);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedAssessment) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        addToast({ type: 'error', message: `File too large. Maximum size is ${MAX_IMAGE_SIZE_LABEL}.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const newEvidence: Evidence = {
          id: `${Date.now()}`,
          type: 'image',
          name: file.name,
          data: e.target?.result as string,
        };
        const updatedAssessment = {
            ...selectedAssessment,
            evidence: [...(selectedAssessment.evidence || []), newEvidence]
        };
        updateAssessment(updatedAssessment);
        addToast({type: 'success', message: 'Image added as evidence.'})
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnalyzeImage = async (evidenceId: string) => {
     if (!selectedAssessment) return;
     const evidenceToAnalyze = selectedAssessment.evidence?.find(e => e.id === evidenceId);
     if (!evidenceToAnalyze) return;

     const updateEvidenceState = (evidenceId: string, updates: Partial<Evidence>) => {
         const newAssessment = { ...selectedAssessment };
         newAssessment.evidence = newAssessment.evidence?.map(e => e.id === evidenceId ? { ...e, ...updates } : e);
         updateAssessment(newAssessment);
     };

     updateEvidenceState(evidenceId, { isAnalyzing: true, analysis: '' });
     
     let timeoutId: ReturnType<typeof setTimeout> | null = null;
     try {
         const base64Data = evidenceToAnalyze.data.split(',')[1];
         const mimeType = evidenceToAnalyze.data.split(';')[0].split(':')[1];
         const langInstr = language === 'sw' ? 'Respond in Swahili (Kiswahili).' : 'Respond in English.';
         const prompt = `Analyze this image in the context of a potential environmental or social impact assessment in Zanzibar. Describe what you see and identify any potential points of concern. Be objective and descriptive. ${langInstr}`;
         
          const { streamAIResponse } = await import('../services/aiClient');
          const stream = await streamAIResponse('analyzeImage', {
              prompt,
              image: base64Data,
              mimeType,
              model: MODELS.flash
          });
         
         let fullText = '';
         await readStream(stream, chunk => {
             fullText += chunk;
          if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                  const latestAssessments = assessmentsRef.current;
                  const analyzedId = selectedAssessment.id;
                  const newAssessments = latestAssessments.map(a => a.id === analyzedId ? {
                      ...a,
                      evidence: a.evidence?.map(e => e.id === evidenceId ? {...e, analysis: fullText} : e)
                  } : a);
                  setAssessments(newAssessments);
                  // Only overwrite selection if user is still viewing the same assessment
                  setSelectedAssessment(prev => {
                      if (prev?.id === analyzedId) {
                          return newAssessments.find(a => a.id === analyzedId) || null;
                      }
                      return prev;
                  });
              }, 50);
         }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });
          if (timeoutId) clearTimeout(timeoutId);
          const latestAssessments = assessmentsRef.current;
          const analyzedId = selectedAssessment.id;
          const finalAssessments = latestAssessments.map(a => a.id === analyzedId ? {
              ...a,
              evidence: a.evidence?.map(e => e.id === evidenceId ? {...e, analysis: fullText, isAnalyzing: false} : e)
          } : a);
          setAssessments(finalAssessments);
          setSelectedAssessment(prev => {
              if (prev?.id === analyzedId) {
                  return finalAssessments.find(a => a.id === analyzedId) || null;
              }
              return prev;
          });
      } catch {
          if (timeoutId) clearTimeout(timeoutId);
          addToast({ type: 'error', message: 'Image analysis failed.' });
          updateEvidenceState(evidenceId, { analysis: 'Error during analysis.', isAnalyzing: false });
      }
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    if (!selectedAssessment) return;
    const updatedAssessment = {
        ...selectedAssessment,
        evidence: selectedAssessment.evidence?.filter(e => e.id !== evidenceId)
    };
    updateAssessment(updatedAssessment);
    addToast({ type: 'info', message: 'Evidence removed.' });
  };
  
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updatedAssessments = assessments.filter(a => a.id !== deleteTarget);
    setAssessments(updatedAssessments);
    if (selectedAssessment?.id === deleteTarget) setSelectedAssessment(updatedAssessments[0] || null);
    setDeleteTarget(null);
    addToast({ type: 'info', message: 'Assessment deleted.' });
  };

  const handleExport = (assessment: Assessment) => {
    // POST to server-side PDF generator
    fetch((import.meta.env.VITE_PDF_SERVER_URL || '') + '/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment),
    }).then(async res => {
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(assessment.projectName || 'assessment').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast({ type: 'info', message: 'PDF generated and downloaded.' });
    }).catch(() => {
      addToast({ type: 'error', message: 'PDF generation failed.' });
    });
  };
  
  const handleToggleEdit = () => {
    if (!selectedAssessment) return;
    if (isEditing) {
        const updatedAssessment = { ...selectedAssessment, report: editedReport };
        updateAssessment(updatedAssessment);
        addToast({ type: 'success', message: 'Report updated successfully.'});
        setIsEditing(false);
    } else {
        setEditedReport(selectedAssessment.report);
        setIsEditing(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
        <div className="md:col-span-1 lg:col-span-1">
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{t('locker.savedAssessments')}</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {filteredAssessments.length}
              </span>
            </div>
            <div className="p-2 border-b border-slate-200 overflow-x-auto" role="tablist" aria-label="Assessment type filter">
              <div className="flex gap-1 min-w-max">
              <button role="tab" aria-selected={activeTab === 'all'} id="el-tab-all" aria-controls="el-panel-all" onClick={() => setActiveTab('all')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'all' ? 'bg-brand-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('locker.all')}</button>
              <button role="tab" aria-selected={activeTab === 'environmental'} id="el-tab-env" aria-controls="el-panel-env" onClick={() => setActiveTab('environmental')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'environmental' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{t('locker.environmental')}</button>
              <button role="tab" aria-selected={activeTab === 'social'} id="el-tab-social" aria-controls="el-panel-social" onClick={() => setActiveTab('social')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'social' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>{t('locker.social')}</button>
              <button role="tab" aria-selected={activeTab === 'health'} id="el-tab-health" aria-controls="el-panel-health" onClick={() => setActiveTab('health')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'health' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>{t('locker.health')}</button>
              <button role="tab" aria-selected={activeTab === 'climate'} id="el-tab-climate" aria-controls="el-panel-climate" onClick={() => setActiveTab('climate')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'climate' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>{t('locker.climate')}</button>
              <button role="tab" aria-selected={activeTab === 'carbon'} id="el-tab-carbon" aria-controls="el-panel-carbon" onClick={() => setActiveTab('carbon')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'carbon' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>{t('locker.carbon')}</button>
              <button role="tab" aria-selected={activeTab === 'monitoring'} id="el-tab-monitor" aria-controls="el-panel-monitor" onClick={() => setActiveTab('monitoring')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'monitoring' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>{t('locker.monitoring')}</button>
              <button role="tab" aria-selected={activeTab === 'engagement'} id="el-tab-engage" aria-controls="el-panel-engage" onClick={() => setActiveTab('engagement')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'engagement' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>{t('locker.engagement')}</button>
              <button role="tab" aria-selected={activeTab === 'compliance'} id="el-tab-comply" aria-controls="el-panel-comply" onClick={() => setActiveTab('compliance')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'compliance' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>{t('locker.compliance')}</button>
              <button role="tab" aria-selected={activeTab === 'financial'} id="el-tab-fin" aria-controls="el-panel-fin" onClick={() => setActiveTab('financial')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'financial' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{t('locker.financial')}</button>
              <button role="tab" aria-selected={activeTab === 'risk'} id="el-tab-risk" aria-controls="el-panel-risk" onClick={() => setActiveTab('risk')} className={`px-2 py-1.5 text-xs rounded-full min-h-[32px] ${activeTab === 'risk' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>{t('locker.risk')}</button>
              </div>
            </div>
            <div role="tabpanel" aria-label="Assessment list" className="max-h-[40dvh] md:max-h-[calc(100dvh-10rem)] overflow-y-auto">
              {filteredAssessments.length === 0 ? <p className="p-4 text-sm text-slate-500">{t('locker.noSaved')}</p> : (
                  <ul>{filteredAssessments.map(assessment => (
                      <li key={assessment.id} className={`border-b border-slate-200 last:border-b-0 ${selectedAssessment?.id === assessment.id ? 'bg-brand-green-50' : ''}`}>
                          <button onClick={() => setSelectedAssessment(assessment)} className="w-full text-left p-4 hover:bg-slate-50 transition-colors duration-150">
                              <p className="font-semibold text-slate-700 truncate">{assessment.projectName}</p>
                              <p className="text-sm text-slate-500">{assessment.assessmentType} Assessment</p>
                              <p className="text-xs text-slate-400 mt-1">{new Date(assessment.createdAt).toLocaleString()}</p>
                          </button>
                      </li>
                  ))}</ul>
              )}
            </div>
          </Card>
        </div>
      <div className="md:col-span-2 lg:col-span-3">
        <Card className="md:sticky top-28">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800 truncate pr-4 w-full sm:w-auto">{selectedAssessment ? selectedAssessment.projectName : t('locker.selectAssessment')}</h2>
                {selectedAssessment && (
                    <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-auto">
                        <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800"><EditIcon className="h-4 w-4" />{isEditing ? t('locker.saveChanges') : t('common.edit')}</button>
                        <React.Suspense fallback={<div />}> 
                          <ExportPdfButton assessment={selectedAssessment} onExport={() => { handleExport(selectedAssessment); }} />
                        </React.Suspense>
                        <button onClick={() => setDeleteTarget(selectedAssessment.id)} className="text-sm font-medium text-red-500 hover:text-red-700">{t('common.delete')}</button>
                    </div>
                )}
            </div>
            <div className="min-h-[50dvh] md:max-h-[calc(100dvh-12rem)] overflow-y-auto" key={selectedAssessment?.id}>
                {selectedAssessment ? (
                    <div className="divide-y divide-slate-200">
                        {isEditing ? (
                            <textarea value={editedReport} onChange={(e) => setEditedReport(e.target.value)} className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed resize-none" aria-label="Report Editor"/>
                        ) : (
                            <React.Suspense fallback={<div className="p-6"><div className="text-sm text-slate-500">Loading report…</div></div>}>
                              <EvidenceReportViewer report={selectedAssessment.report} />
                            </React.Suspense>
                        )}
                        <React.Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading evidence…</div>}>
                          <EvidenceListPanel assessment={selectedAssessment} onAnalyze={handleAnalyzeImage} onRemove={handleRemoveEvidence} onAddClick={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} onFileChange={handleImageUpload} />
                        </React.Suspense>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="font-semibold">{t('locker.selectAssessment.desc')}</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('confirm.dialog.delete.title')}
        message={t('confirm.dialog.delete.message')}
        confirmLabel={t('common.delete')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
