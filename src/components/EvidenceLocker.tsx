import * as React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Assessment, Evidence } from '../types';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { exportToPdf } from '../services/pdfService';
import { useToasts } from '../hooks/useToasts';
import { streamGeminiResponse } from '../services/geminiApiClient';
import { MODELS } from '../config/ai';
import { MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_LABEL } from '../utils/sanitize';
import { usePiAuth } from '../contexts/PiAuthContext';
import { PiPaymentButton } from './PiPaymentButton';

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);

export const EvidenceLocker: React.FC = () => {
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const [selectedAssessment, setSelectedAssessment] = React.useState<Assessment | null>(assessments[0] || null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedReport, setEditedReport] = React.useState('');
  const [pdfExportUnlocked, setPdfExportUnlocked] = React.useState(false);
  const { addToast } = useToasts();
  const { user, sdkAvailable } = usePiAuth();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    setIsEditing(false);
    setEditedReport('');
  }, [selectedAssessment?.id]);
  
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
     
     try {
         const base64Data = evidenceToAnalyze.data.split(',')[1];
         const mimeType = evidenceToAnalyze.data.split(';')[0].split(':')[1];
         const prompt = `Analyze this image in the context of a potential environmental or social impact assessment in Kenya. Describe what you see and identify any potential points of concern. Be objective and descriptive.`;
         
         const stream = await streamGeminiResponse('analyzeImage', {
             prompt,
             image: base64Data,
             mimeType,
             model: MODELS.flash
         });
         
         const reader = stream.getReader();
         const decoder = new TextDecoder();
         while(true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const currentAssessment = assessments.find(a => a.id === selectedAssessment.id);
            const currentEvidence = currentAssessment?.evidence?.find(e => e.id === evidenceId);
            const updatedAnalysis = (currentEvidence?.analysis || '') + chunk;
            
            const newAssessments = assessments.map(a => a.id === selectedAssessment.id ? {
                ...a,
                evidence: a.evidence?.map(e => e.id === evidenceId ? {...e, analysis: updatedAnalysis} : e)
            } : a);
            setAssessments(newAssessments);
            setSelectedAssessment(newAssessments.find(a => a.id === selectedAssessment.id) || null);
         }
     } catch (error) {
         addToast({ type: 'error', message: 'Image analysis failed.' });
         updateEvidenceState(evidenceId, { analysis: 'Error during analysis.' });
     } finally {
         updateEvidenceState(evidenceId, { isAnalyzing: false });
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
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
        const updatedAssessments = assessments.filter(a => a.id !== id);
        setAssessments(updatedAssessments);
        if (selectedAssessment?.id === id) setSelectedAssessment(updatedAssessments[0] || null);
        addToast({ type: 'info', message: 'Assessment deleted.' });
    }
  };

  const handleExport = (assessment: Assessment) => {
    exportToPdf(assessment);
    addToast({ type: 'info', message: 'Report export started.' });
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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
      <div className="md:col-span-1 lg:col-span-1">
        <Card>
          <div className="p-4 border-b border-slate-200"><h2 className="text-lg font-bold text-slate-800">Saved Assessments</h2></div>
          <div className="max-h-[40vh] md:max-h-[calc(100vh-14rem)] overflow-y-auto">
            {assessments.length === 0 ? <p className="p-4 text-sm text-slate-500">No assessments saved yet.</p> : (
                <ul>{assessments.map(assessment => (
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
                <h2 className="text-xl font-bold text-slate-800 truncate pr-4 w-full sm:w-auto">{selectedAssessment ? selectedAssessment.projectName : 'Select an Assessment'}</h2>
                {selectedAssessment && (
                    <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-auto">
                        <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800"><EditIcon className="h-4 w-4" />{isEditing ? 'Save Changes' : 'Edit'}</button>
                        {(!sdkAvailable || pdfExportUnlocked || !user) ? (
                          <button onClick={() => handleExport(selectedAssessment)} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">Export as PDF</button>
                        ) : (
                          <PiPaymentButton
                            amount={0.05}
                            memo="Unlock PDF export for this session"
                            metadata={{ feature: 'pdf_export' }}
                            onPaymentSuccess={() => {
                              setPdfExportUnlocked(true);
                              handleExport(selectedAssessment);
                            }}
                            className="text-sm font-medium text-yellow-700 hover:text-yellow-900"
                          >
                            Export PDF (0.05 π)
                          </PiPaymentButton>
                        )}
                        <button onClick={() => handleDelete(selectedAssessment.id)} className="text-sm font-medium text-red-500 hover:text-red-700">Delete</button>
                    </div>
                )}
            </div>
            <div className="min-h-[50vh] md:h-[calc(100vh-16rem)] overflow-y-auto" key={selectedAssessment?.id}>
                {selectedAssessment ? (
                    <div className="divide-y divide-slate-200">
                        {isEditing ? (
                            <textarea value={editedReport} onChange={(e) => setEditedReport(e.target.value)} className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed resize-none" aria-label="Report Editor"/>
                        ) : (
                            <div className="p-6 prose prose-slate max-w-none"><ReactMarkdown>{selectedAssessment.report}</ReactMarkdown></div>
                        )}
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Associated Evidence</h3>
                            <div className="space-y-4">
                                {selectedAssessment.evidence?.map(item => (
                                    <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <img src={item.data} alt={item.name} className="w-full md:w-48 h-auto object-cover rounded-md" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold text-slate-700">{item.name}</p>
                                                    <button onClick={() => handleRemoveEvidence(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                                                </div>
                                                <div className="mt-2 prose prose-sm max-w-none text-slate-600">
                                                    {item.analysis ? <ReactMarkdown>{item.analysis}</ReactMarkdown> : <p className="text-slate-500 italic">No analysis yet.</p>}
                                                    {item.isAnalyzing && !item.analysis && <p className="text-slate-500">Analyzing...</p>}
                                                </div>
                                                <button onClick={() => handleAnalyzeImage(item.id)} disabled={item.isAnalyzing} className="mt-3 text-sm font-medium text-brand-green-600 hover:text-brand-green-800 disabled:opacity-50 disabled:cursor-wait">
                                                    {item.isAnalyzing ? 'Analyzing...' : item.analysis ? 'Re-analyze Image' : 'Analyze Image'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full text-center py-2 px-4 border-2 border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-400">Add Image Evidence</button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="font-semibold">Select an assessment from the list to view its details.</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};
