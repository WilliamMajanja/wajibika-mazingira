import React, { useEffect, useState, useMemo } from 'react';
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
import { MagnifyingGlassIcon } from '../components/icons/MagnifyingGlassIcon';
import { ROLES } from '../constants';


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

type SortOrder = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { assessments, isLoading: assessmentsLoading, error, createManualAssessment } = useAssessments();
  const { evidence, isLoading: evidenceLoading } = useEvidence();
  const { setTitle } = useLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');

  useEffect(() => {
      setTitle('Dashboard');
  }, [setTitle]);

  const filteredAndSortedAssessments = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = searchTerm.trim()
      ? assessments.filter(
          (assessment) =>
            assessment.project_name.toLowerCase().includes(lowercasedTerm) ||
            assessment.location.toLowerCase().includes(lowercasedTerm)
        )
      : [...assessments]; // Create a new array to avoid mutating the original

    return filtered.sort((a, b) => {
        switch (sortOrder) {
            case 'name-asc':
                return a.project_name.localeCompare(b.project_name);
            case 'name-desc':
                return b.project_name.localeCompare(a.project_name);
            case 'date-asc':
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'date-desc':
            default:
                return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });
  }, [assessments, searchTerm, sortOrder]);
  
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

       <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
            <input
                type="text"
                placeholder="Search assessments by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
                aria-label="Search assessments"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-green-light focus:border-brand-green-light bg-white"
            aria-label="Sort assessments"
        >
            <option value="date-desc">Sort by Newest First</option>
            <option value="date-asc">Sort by Oldest First</option>
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{searchTerm ? 'Search Results' : 'Recent Assessments'}</h3>
        {hasRole([ROLES.PRACTITIONER, ROLES.ADMIN]) && (
            <div className="flex items-center gap-2">
                <Button onClick={() => setIsModalOpen(true)} variant="secondary">
                  Create Manual Record
                </Button>
                <Link to="/new-assessment">
                    <Button>Start AI Assessment</Button>
                </Link>
            </div>
        )}
      </div>
      
      {error && (
          <div className="text-center py-12 bg-red-50 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium text-red-700">Failed to load assessments.</h4>
            <p className="text-red-600 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-2">Please check your configuration or try again later.</p>
          </div>
      )}

      {assessmentsLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
           <h4 className="text-lg font-medium text-gray-700">Loading assessments...</h4>
        </div>
      )}

      {!error && !assessmentsLoading && (
        <>
          {assessments.length > 0 ? (
            <>
              {filteredAndSortedAssessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedAssessments.map(assessment => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h4 className="text-lg font-medium text-gray-700">No Assessments Found</h4>
                  <p className="text-gray-500 mt-2">Your search for "{searchTerm}" did not match any assessments.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h4 className="text-lg font-medium text-gray-700">No assessments found.</h4>
              <p className="text-gray-500 mt-2">Get started by creating your first impact assessment.</p>
            </div>
          )}
        </>
      )}
      
       <ManualAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
};
