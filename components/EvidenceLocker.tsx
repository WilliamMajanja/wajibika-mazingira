import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Assessment } from '../types';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { exportToPdf } from '../services/pdfService';
import { useToasts } from '../hooks/useToasts';

export const EvidenceLocker: React.FC = () => {
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(assessments[0] || null);
  const { addToast } = useToasts();
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
        const updatedAssessments = assessments.filter(a => a.id !== id);
        setAssessments(updatedAssessments);
        if (selectedAssessment?.id === id) {
            setSelectedAssessment(updatedAssessments[0] || null);
        }
        addToast({ type: 'info', message: 'Assessment deleted.' });
    }
  };

  const handleExport = (assessment: Assessment) => {
    exportToPdf(assessment);
    addToast({ type: 'info', message: 'Report export started.' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
      <div className="md:col-span-1 lg:col-span-1">
        <Card>
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Saved Assessments</h2>
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
            {assessments.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No assessments saved yet. Generate one from the 'Impact Assessment' tab.</p>
            ) : (
                <ul>
                    {assessments.map(assessment => (
                        <li key={assessment.id} className={`border-b border-slate-200 last:border-b-0 ${selectedAssessment?.id === assessment.id ? 'bg-brand-green-50' : ''}`}>
                            <button onClick={() => setSelectedAssessment(assessment)} className="w-full text-left p-4 hover:bg-slate-50 transition-colors duration-150">
                                <p className="font-semibold text-slate-700 truncate">{assessment.projectName}</p>
                                <p className="text-sm text-slate-500">{assessment.assessmentType} Assessment</p>
                                <p className="text-xs text-slate-400 mt-1">{new Date(assessment.createdAt).toLocaleString()}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <Card className="sticky top-28">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800 truncate pr-4">
                    {selectedAssessment ? selectedAssessment.projectName : 'Select an Assessment'}
                </h2>
                {selectedAssessment && (
                    <div className="flex items-center space-x-4 flex-shrink-0">
                         <button onClick={() => handleExport(selectedAssessment)} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            Export as PDF
                        </button>
                        <button onClick={() => handleDelete(selectedAssessment.id)} className="text-sm font-medium text-red-500 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                )}
            </div>
            <div className="p-6 prose prose-slate max-w-none h-[calc(100vh-16rem)] overflow-y-auto">
                {selectedAssessment ? (
                    <ReactMarkdown>{selectedAssessment.report}</ReactMarkdown>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="font-semibold">Select an assessment from the list to view its details.</p>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};