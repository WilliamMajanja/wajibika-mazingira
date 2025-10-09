import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Assessment } from '../types';
import { Card } from './common/Card';
import ReactMarkdown from 'react-markdown';
import { exportToPdf } from '../services/pdfService';
import { useToasts } from '../hooks/useToasts';

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

export const EvidenceLocker: React.FC = () => {
  const [assessments, setAssessments] = useLocalStorage<Assessment[]>('assessments', []);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(assessments[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');
  const { addToast } = useToasts();
  
  useEffect(() => {
    setIsEditing(false);
    setEditedReport('');
  }, [selectedAssessment?.id]);

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
  
  const handleToggleEdit = () => {
    if (!selectedAssessment) return;
    
    if (isEditing) {
        // Saving changes
        const updatedAssessments = assessments.map(a => 
            a.id === selectedAssessment.id ? { ...a, report: editedReport } : a
        );
        setAssessments(updatedAssessments);
        setSelectedAssessment(prev => prev ? { ...prev, report: editedReport } : null);
        addToast({ type: 'success', message: 'Report updated successfully.'});
        setIsEditing(false);
    } else {
        // Entering edit mode
        setEditedReport(selectedAssessment.report);
        setIsEditing(true);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
      <div className="md:col-span-1 lg:col-span-1">
        <Card>
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">Saved Assessments</h2>
          </div>
          <div className="max-h-[40vh] md:max-h-[calc(100vh-14rem)] overflow-y-auto">
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
        <Card className="md:sticky top-28">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 min-h-[65px]">
                <h2 className="text-xl font-bold text-slate-800 truncate pr-4 w-full sm:w-auto">
                    {selectedAssessment ? selectedAssessment.projectName : 'Select an Assessment'}
                </h2>
                {selectedAssessment && (
                    <div className="flex items-center space-x-4 flex-shrink-0 self-end sm:self-auto">
                         <button onClick={handleToggleEdit} className="flex items-center gap-1.5 text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            <EditIcon className="h-4 w-4" />
                            {isEditing ? 'Save Changes' : 'Edit'}
                        </button>
                         <button onClick={() => handleExport(selectedAssessment)} className="text-sm font-medium text-brand-green-600 hover:text-brand-green-800">
                            Export as PDF
                        </button>
                        <button onClick={() => handleDelete(selectedAssessment.id)} className="text-sm font-medium text-red-500 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                )}
            </div>
            <div className="min-h-[50vh] md:h-[calc(100vh-16rem)] overflow-y-auto">
                {selectedAssessment ? (
                    isEditing ? (
                        <textarea
                            value={editedReport}
                            onChange={(e) => setEditedReport(e.target.value)}
                            className="w-full h-full p-6 bg-slate-50 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green-500 font-mono text-sm leading-relaxed"
                            aria-label="Report Editor"
                        />
                    ) : (
                         <div className="p-6 prose prose-slate max-w-none">
                            <ReactMarkdown>{selectedAssessment.report}</ReactMarkdown>
                        </div>
                    )
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center h-full text-slate-500 text-center">
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