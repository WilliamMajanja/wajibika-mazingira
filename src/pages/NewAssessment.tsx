import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentType, ManualFormData } from '../types';
import { ASSESSMENT_TYPES } from '../constants';
import { Button } from '../components/common/Button';
import { generateAssessmentReport } from '../services/geminiService';
import { ManualAssessmentModal } from '../components/ManualAssessmentModal';
import { useAssessments } from '../contexts/AssessmentContext';
import { useLayout } from '../contexts/LayoutContext';

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { createAIAssessment, createManualAssessment } = useAssessments();
  const { setTitle } = useLayout();

  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(AssessmentType.EIA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    setTitle('New Assessment');
  }, [setTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectLocation || !projectDescription) {
      setError('Please fill in all project details.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const report = await generateAssessmentReport(
        assessmentType,
        projectName,
        projectLocation,
        projectDescription,
        null
      );
      
      const newAssessment = await createAIAssessment(report, {name: projectName, location: projectLocation});
      
      navigate(`/assessment/${newAssessment.id}`);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (
    projectDetails: { name: string; location: string; assessmentType: AssessmentType },
    formData: ManualFormData
  ) => {
    // The modal's internal state will handle loading and error feedback.
    // This function's only jobs are to call the context and navigate on success.
    // The promise rejection will be caught by the modal's submit handler.
    const newAssessment = await createManualAssessment(projectDetails, formData);
    setIsModalOpen(false);
    // Navigate to the new assessment for immediate feedback, which is better UX.
    navigate(`/assessment/${newAssessment.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Create New Impact Assessment</h2>
        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Perform Manual Assessment
        </Button>
      </div>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">AI-Powered Assessment</h3>
      
      <p className="text-gray-500 mb-6">Fill in the details below and our AI will generate a comprehensive report based on Kenyan environmental law.</p>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p>{error}</p></div>}
        
        <div>
          <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">Type of Assessment</label>
          <select
            id="assessmentType"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
          >
            {ASSESSMENT_TYPES.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
            placeholder="e.g., Lakeside Residential Complex"
          />
        </div>

        <div>
          <label htmlFor="projectLocation" className="block text-sm font-medium text-gray-700 mb-1">Project Location</label>
          <input
            type="text"
            id="projectLocation"
            value={projectLocation}
            onChange={(e) => setProjectLocation(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
            placeholder="e.g., Kisumu County, Kenya"
          />
        </div>
        
        <div>
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
          <textarea
            id="projectDescription"
            rows={5}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
            placeholder="Describe the scope, scale, and nature of the proposed project..."
          />
        </div>

        <div className="text-right">
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? 'Generating Report...' : 'Generate AI Report'}
          </Button>
        </div>
      </form>
      
      <ManualAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
};
