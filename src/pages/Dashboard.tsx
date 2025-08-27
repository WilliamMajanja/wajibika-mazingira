import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssessmentCard } from '../components/AssessmentCard';
import { Button } from '../components/common/Button';
import { UsersIcon } from '../components/icons/UsersIcon';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { useAuth } from '../contexts/AuthContext';
import { useAssessments } from '../contexts/AssessmentContext';
import { useEvidence } from '../contexts/EvidenceContext';
import { useLayout } from '../contexts/LayoutContext';
import { ManualAssessmentModal } from '../components/ManualAssessmentModal';
import { AssessmentType, ManualFormData } from '../types';


const StatCard: React.FC<{icon: React.ReactNode, title: string, value: string | number, linkTo: string}> = ({icon, title, value, linkTo}) => (
    <Link to={linkTo} className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow">
        <div className="p-3 rounded-full bg-brand-green-light/10 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Link>
)


export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { assessments, isLoading: assessmentsLoading, error, createManualAssessment } = useAssessments();
  const { evidence, isLoading: evidenceLoading } = useEvidence();
  const { setTitle } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
      setTitle('Dashboard');
  }, [setTitle]);
  
  const userName = user?.name || user?.email || 'Practitioner';
  
  const handleManualSubmit = async (
    projectDetails: { name: string; location: string; assessmentType: AssessmentType },
    formData: ManualFormData
  ) => {
    try {
      await createManualAssessment(projectDetails, formData);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create manual assessment:", err);
      // Re-throw the error to be caught by the modal's internal state
      throw err;
    }
  };


  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Welcome, {userName}</h2>
        <p className="mt-1 text-gray-600">
          This is your AI-powered assistant for navigating Kenyan Environmental Law.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<DocumentTextIcon className="h-6 w-6 text-brand-green-light" />} 
            title="Assessments Created"
            value={assessmentsLoading ? '...' : assessments.length}
            linkTo="/new-assessment"
          />
          <StatCard 
            icon={<FolderPlusIcon className="h-6 w-6 text-brand-green-light" />} 
            title="Evidence Submitted"
            value={evidenceLoading ? '...' : evidence.length}
            linkTo="/evidence-locker"
          />
          <StatCard 
            icon={<UsersIcon className="h-6 w-6 text-brand-green-light" />} 
            title="Community Forum"
            value={"Active"}
            linkTo="/community-forum"
          />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">Recent Assessments</h3>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsModalOpen(true)} variant="secondary">
              Create Manual Record
            </Button>
            <Link to="/new-assessment">
                <Button>Start AI Assessment</Button>
            </Link>
        </div>
      </div>
      
      {error && (
          <div className="text-center py-12 bg-red-50 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium text-red-700">Failed to load assessments.</h4>
            <p className="text-red-600 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Please check your configuration or try again later.</p>
          </div>
      )}

      {!error && assessmentsLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
           <h4 className="text-lg font-medium text-gray-700">Loading assessments...</h4>
        </div>
      )}

      {!error && !assessmentsLoading && assessments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.slice(0, 6).map(assessment => (
            <AssessmentCard key={assessment.id} assessment={assessment} />
          ))}
        </div>
      )}

      {!error && !assessmentsLoading && assessments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <h4 className="text-lg font-medium text-gray-700">No assessments found.</h4>
          <p className="text-gray-500 mt-2">Get started by creating your first impact assessment.</p>
        </div>
      )}
      
       <ManualAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
};