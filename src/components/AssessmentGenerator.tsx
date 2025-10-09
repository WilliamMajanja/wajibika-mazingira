
import React, { useState, useRef } from 'react';
import { Assessment, AssessmentType } from '../types';
import { generateImpactAssessment } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';

const assessmentTypes: AssessmentType[] = ['Environmental', 'Social', 'Health', 'Climate', 'Cumulative'];

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

export const AssessmentGenerator: React.FC = () => {
  const [formData, setFormData] = useState<Omit<Assessment, 'id' | 'report' | 'createdAt'>>({
    projectName: '',
    projectProponent: '',
    location: '',
    projectType: '',
    description: '',
    assessmentType: 'Environmental',
    assessorName: '',
    assessorType: '',
  });
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [editedReport, setEditedReport] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportIncomplete, setIsReportIncomplete] = useState(false);
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const { addToast } = useToasts();
  const reportContainerRef = useRef<HTMLDivElement | null>(null);

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
    setGeneratedReport(''); // Show loading spinner and clear previous report
    setEditedReport('');
    setIsEditing(false);
    setIsReportIncomplete(false);
    
    // Auto-scroll to the report section on smaller screens
    if (window.innerWidth < 768) { // 768px is the 'md' breakpoint in Tailwind
        reportContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    let fullReport = '';
    try {
      await generateImpactAssessment(formData, (chunk) => {
        fullReport += chunk;
        setGeneratedReport(prev => (prev ?? '') + chunk);
      });
      addToast({ type: 'success', message: 'Assessment report generated successfully.' });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addToast({ type: 'error', message: `Failed to generate report: ${errorMessage}` });
      setGeneratedReport(null); // Clear report on error
    } finally {
      setIsLoading(false);
      
      const completionMarker = '*** END OF REPORT ***';
      const isComplete = fullReport.includes(completionMarker);
      const finalReport = fullReport.replace(completionMarker, '').trim();
      
      // Perform the final, clean state update
      setGeneratedReport(finalReport || null);
      setEditedReport(finalReport);

      // Show a warning if the report might be incomplete
      if (fullReport && !isComplete) {
          setIsReportIncomplete(true);
          addToast({ type: 'error', message: 'The AI may have been interrupted. Please review the report.' });
      }
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

    const newAssessment: Assessment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...formData,
        report: generatedReport,
        createdAt: new Date().toISOString(),
    };
    
    setAssessments([newAssessment, ...assessments]);
    addToast({ type: 'success', message: 'Assessment saved to Evidence Locker.' });
    
    // Reset form and state for a new assessment
     setFormData({
        projectName: '', projectProponent: '', location: '', projectType: '', description: '',
        assessmentType: 'Environmental', assessorName: '', assessorType: '',
    });
    setGeneratedReport(null);
    setEditedReport('');
    setIsEditing(false);
    setIsReportIncomplete(false);
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
      {/* Form Section */}
      <div className="md:col-span-1 lg:col-span-2">
        <Card className="md:sticky top-28">
          <form onSubmit={handleGenerate}>
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Project Details</h2>
                <p className="text-sm text-slate-500">Fill in the form to generate an impact assessment.</p>
            </div>
            <div className="p-6 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input type="text" name="projectName" id="projectName" value={formData.projectName} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="projectProponent" className="block text-sm font-medium text-slate-700 mb-1">Project Proponent</label>
                    <input type="text" name="projectProponent" id="projectProponent" value={formData.projectProponent} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Location (County, Town)</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-slate-700 mb-1">Project Type</label>
                    <input type="text" name="projectType" id="projectType" value={formData.projectType} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Project Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                </div>
                 <div>
                    <label htmlFor="assessmentType" className="block text-sm font-medium text-slate-700 mb-1">Assessment Type</label>
                    <select name="assessmentType" id="assessmentType" value={formData.assessmentType} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500">
                        {assessmentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="pt-2">
                    <h3 className="text-base font-bold text-slate-800">Assessor Details (Optional)</h3>
                     <p className="text-sm text-slate-500 mb-2">Leave blank to fill by hand on the printed PDF.</p>
                     <div className="space-y-4">
                         <div>
                            <label htmlFor="assessorName" className="block text-sm font-medium text-slate-700 mb-1">Assessor Name</label>
                            <input type="text" name="assessorName" id="assessorName" value={formData.assessorName} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                        </div>
                        <div>
                            <label htmlFor="assessorType" className="block text-sm font-medium text-slate-700 mb-1">Assessor Type / Title</label>
                            <input type="text" name="assessorType" id="assessorType" value={formData.assessorType} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green-500 focus:border-brand-green-500" />
                        </div>
                     </div>
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
                            Generating...
                        </>
                    ) : 'Generate Report'}
                </button>
            </div>
          </form>
        </Card>
      </div>
      
      {/* Report Section */}
      <div className="md:col-span-1 lg:col-span-3" ref={reportContainerRef}>
        <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800">Generated Report</h2>
                {generatedReport && !isLoading && (
                    <div className="flex items-center space-x-4">
                        <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            <EditIcon className="h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Edit'}
                        </button>
                        <button onClick={handleSave} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            Save to Locker
                        </button>
                    </div>
                )}
            </div>
             {isReportIncomplete && !isLoading && (
                <div className="p-3 bg-yellow-100 border-b border-yellow-200 text-sm text-yellow-800 flex items-start space-x-3" role="alert">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <strong className="font-semibold">Potential Incomplete Report</strong>
                        <p className="mt-1">The AI may have been interrupted. Please review the content carefully. If sections are missing, try generating the report again.</p>
                    </div>
                </div>
            )}
            <div className="min-h-[50vh] md:h-[calc(100vh-16rem)] overflow-y-auto">
                {isLoading && !generatedReport && (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
                       <svg className="animate-spin h-10 w-10 text-brand-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold">Generating assessment...</p>
                        <p className="text-sm">This may take a moment. The AI is analyzing the project details.</p>
                    </div>
                )}
                {(generatedReport || (isLoading && generatedReport !== null)) && (
                    isEditing ? (
                         <textarea
                            value={editedReport}
                            onChange={(e) => setEditedReport(e.target.value)}
                            className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed"
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
                        <p className="font-semibold">The generated report will appear here.</p>
                        <p className="text-sm">Complete the form and click "Generate Report" to start.</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};
