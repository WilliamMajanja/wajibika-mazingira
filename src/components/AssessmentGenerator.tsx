import * as React from 'react';
import { Assessment, AssessmentType, Evidence } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { MODELS, getAssessmentInstruction, REPORT_SECTIONS, withLanguage } from '../config/ai';
import { getSectionPrompt } from '../utils/promptBuilder';
import { streamAIResponse } from '../services/aiClient';
import { useStreamReader } from '../hooks/useStreamReader';
import { useI18n } from '../config/i18n';

const assessmentTypes: { value: AssessmentType; label: string }[] = [
  { value: 'Environmental', label: 'Environmental' },
  { value: 'Social', label: 'Social' },
  { value: 'Health', label: 'Health' },
  { value: 'Climate', label: 'Climate' },
  { value: 'Carbon_Sequestration', label: 'Carbon Sequestration' },
  { value: 'Cumulative', label: 'Cumulative' },
  { value: 'Project_Monitoring', label: 'Project Monitoring' },
  { value: 'Community_Engagement', label: 'Community Engagement' },
  { value: 'Compliance_Verification', label: 'Compliance Verification' },
  { value: 'Financial_Analysis', label: 'Financial Analysis' },
  { value: 'Risk_Assessment', label: 'Risk Assessment' },
];

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

export const AssessmentGenerator: React.FC = () => {
  const [formData, setFormData] = useLocalStorage<Omit<Assessment, 'id' | 'report' | 'createdAt' | 'evidence'>>('assessmentFormData', {
    projectName: '',
    projectProponent: '',
    location: '',
    projectType: '',
    description: '',
    assessmentType: 'Environmental',
    assessorName: '',
    assessorType: '',
  });
  const [generatedReport, setGeneratedReport] = useLocalStorage<string | null>('assessmentGeneratedReport', null);
  const [editedReport, setEditedReport] = useLocalStorage<string>('assessmentEditedReport', '');
  const [isEditing, setIsEditing] = useLocalStorage<boolean>('assessmentIsEditing', false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [useDeepAnalysis, setUseDeepAnalysis] = useLocalStorage<boolean>('assessmentDeepAnalysis', false);
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();
  const reportContainerRef = React.useRef<HTMLDivElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.projectName.trim() && formData.projectProponent.trim() && formData.location.trim() && formData.projectType.trim() && formData.description.trim();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
        addToast({ type: 'error', message: 'Please fill in all project details.' });
        return;
    }

    setIsLoading(true);
    setGeneratedReport('');
    setEditedReport('');
    setIsEditing(false);
    
    if (window.innerWidth < 768) {
        reportContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    let fullReport = '';
    
    try {
      const model = useDeepAnalysis ? MODELS.pro : MODELS.flash;
      const task = useDeepAnalysis ? 'complexGeneration' : 'chat';

      for (const section of REPORT_SECTIONS) {
          const sectionPrompt = getSectionPrompt(formData, section, language);
          
          const sectionStream = await streamAIResponse(task, {
              messages: [{ role: 'user', text: sectionPrompt }],
              systemInstruction: withLanguage(getAssessmentInstruction(formData.assessmentType), language),
              model,
          });

          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          await readStream(sectionStream, chunk => {
              fullReport += chunk;
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => setGeneratedReport(fullReport), 50);
          }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });
          if (timeoutId) clearTimeout(timeoutId);
          setGeneratedReport(fullReport);
          
          if (!fullReport.endsWith('\n\n')) {
               fullReport += '\n\n';
               setGeneratedReport(fullReport);
          }
      }
      
      const finalReport = fullReport.trim();
      setGeneratedReport(finalReport);
      setEditedReport(finalReport);
      
      if (finalReport) {
        addToast({ type: 'success', message: 'Assessment report generated successfully.' });
      } else {
        setGeneratedReport(null);
        addToast({ type: 'error', message: 'The AI returned an empty response. Please try again.' });
      }

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addToast({ type: 'error', message: `Failed to generate report: ${errorMessage}` });
      setGeneratedReport(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleEdit = () => {
    if (isEditing) {
      setGeneratedReport(editedReport);
      addToast({ type: 'info', message: 'Changes applied to the report.' });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSave = () => {
    if (!generatedReport || !isFormValid()) {
        addToast({ type: 'error', message: 'Cannot save. No report generated or form is incomplete.' });
        return;
    }

    const report = isEditing ? editedReport : generatedReport;

    // Extract key sections from the report as evidence entries
    const evidenceEntries: Evidence[] = [];
    const sectionRegex = /###\s+([\d.]+)\s+(.+)/g;
    let sectionMatch;
    let sectionIndex = 0;
    while ((sectionMatch = sectionRegex.exec(report)) !== null && sectionIndex < 8) {
      const sectionTitle = sectionMatch[0].trim();
      const sectionEnd = report.indexOf('###', sectionMatch.index + 1);
      const sectionContent = sectionEnd === -1
        ? report.slice(sectionMatch.index)
        : report.slice(sectionMatch.index, sectionEnd);
      evidenceEntries.push({
        id: `ev-${Date.now()}-${sectionIndex}`,
        type: 'text',
        name: sectionTitle.replace('### ', ''),
        data: sectionContent.trim(),
      });
      sectionIndex++;
    }

    const newAssessment: Assessment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...formData,
        report,
        createdAt: new Date().toISOString(),
        evidence: evidenceEntries.length > 0 ? evidenceEntries : [],
    };
    
    setAssessments([newAssessment, ...assessments]);
    addToast({ type: 'success', message: `Assessment saved to Evidence Locker with ${evidenceEntries.length} related assets.` });
    
    setFormData({
        projectName: '', projectProponent: '', location: '', projectType: '', description: '',
        assessmentType: 'Environmental', assessorName: '', assessorType: '',
    });
    setGeneratedReport(null);
    setEditedReport('');
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
      {/* Form Section */}
      <div className="md:col-span-1 lg:col-span-2">
        <Card className="md:sticky top-28">
          <form onSubmit={handleGenerate}>
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">{t('assessment.title')}</h2>
                <p className="text-sm text-slate-500">{t('assessment.subtitle')}</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60dvh] overflow-y-auto">
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.projectName')} <span className="text-red-500">*</span></label>
                    <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="projectProponent" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.projectProponent')} <span className="text-red-500">*</span></label>
                    <input type="text" name="projectProponent" id="projectProponent" value={formData.projectProponent} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.location')} <span className="text-red-500">*</span></label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.projectType')} <span className="text-red-500">*</span></label>
                    <input type="text" name="projectType" id="projectType" value={formData.projectType} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.description')} <span className="text-red-500">*</span></label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={5} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                 <div>
                    <label htmlFor="assessmentType" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.assessmentType')}</label>
                    <select name="assessmentType" id="assessmentType" value={formData.assessmentType} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500">
                        {assessmentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
                <div className="pt-2">
                    <h3 className="text-base font-bold text-slate-800">Assessor Details (Optional)</h3>
                     <p className="text-sm text-slate-500 mb-2">Leave blank to fill by hand on the printed PDF.</p>
                     <div className="space-y-4">
                         <div>
                            <label htmlFor="assessorName" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.assessorName')}</label>
                            <input type="text" name="assessorName" id="assessorName" value={formData.assessorName} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                        </div>
                        <div>
                            <label htmlFor="assessorType" className="block text-sm font-medium text-slate-700 mb-1">{t('assessment.assessorTitle')}</label>
                            <input type="text" name="assessorType" id="assessorType" value={formData.assessorType} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500" />
                        </div>
                     </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <span id="deep-analysis-label" className="font-medium text-slate-700">{t('assessment.deepAnalysis')}</span>
                        <p className="text-xs text-slate-500">{t('assessment.deepAnalysis.desc')}</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        id="deepAnalysis"
                        aria-labelledby="deep-analysis-label"
                        aria-checked={useDeepAnalysis}
                        onClick={() => setUseDeepAnalysis(!useDeepAnalysis)}
                        className={`${useDeepAnalysis ? 'bg-brand-green-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:ring-offset-2`}
                    >
                        <span className={`${useDeepAnalysis ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                    </button>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button type="submit" disabled={isLoading || !isFormValid()} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green-600 hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('assessment.generating')}
                        </>
                    ) : t('assessment.generate')}
                </button>
            </div>
          </form>
        </Card>
      </div>
      
      <div className="md:col-span-1 lg:col-span-3" ref={reportContainerRef}>
        <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800">{t('assessment.generated.title')}</h2>
                {generatedReport && !isLoading && (
                    <div className="flex items-center space-x-4">
                        <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            <EditIcon className="h-4 w-4" />
                            {isEditing ? t('assessment.editChanges') : t('common.edit')}
                        </button>
                        <button onClick={handleSave} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            {t('assessment.report.saveToLocker')}
                        </button>
                    </div>
                )}
            </div>
            <div className="min-h-[50dvh] md:max-h-[calc(100dvh-12rem)] overflow-y-auto">
                {isLoading && !generatedReport && (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                       <svg className="animate-spin h-10 w-10 text-brand-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold">{t('assessment.generating.title')}</p>
                        <p className="text-sm">{t('assessment.generating.desc')}</p>
                    </div>
                )}
                {(generatedReport || (isLoading && generatedReport !== null)) && (
                    isEditing ? (
                         <textarea
                            value={editedReport}
                            onChange={(e) => setEditedReport(e.target.value)}
                            className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed resize-none"
                            aria-label="Report Editor"
                        />
                    ) : (
                        <div className="p-6 prose prose-slate max-w-none">
                            <ReactMarkdown>{generatedReport}</ReactMarkdown>
                        </div>
                    )
                )}
                {!generatedReport && !isLoading && generatedReport === null && (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-semibold">{t('assessment.empty.title')}</p>
                        <p className="text-sm">{t('assessment.empty.desc')}</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};
