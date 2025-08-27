import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Assessment, AssessmentReport, AssessmentType, ManualFormData } from '../types';
import { useAuth } from './AuthContext';

interface AssessmentContextType {
  assessments: Assessment[];
  isLoading: boolean;
  error: string | null;
  getAssessmentById: (id: string) => Assessment | undefined;
  fetchAssessmentById: (id: string) => Promise<Assessment | null>;
  createAIAssessment: (report: AssessmentReport, projectDetails: {name: string, location: string}) => Promise<Assessment>;
  createManualAssessment: (
    projectDetails: { name: string; location: string; assessmentType: AssessmentType },
    formData: ManualFormData
  ) => Promise<Assessment>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setAssessments([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAccessToken();
        const response = await fetch(`/api/assessments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch assessments from API.' }));
          throw new Error(errorData.error || 'Failed to fetch assessments.');
        }
        const data: Assessment[] = await response.json();
        setAssessments(data);
      } catch (e: any) {
        console.error("Failed to fetch assessments from API", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssessments();
  }, [isAuthenticated, getAccessToken]);


  const getAssessmentById = useCallback((id: string) => {
    return assessments.find(a => a.id === id);
  }, [assessments]);

  const fetchAssessmentById = async (id: string): Promise<Assessment | null> => {
    if (!isAuthenticated) return null;
    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/assessments?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: 'Failed to fetch assessment.'}));
        throw new Error(errorData.error || "Failed to fetch assessment.");
      }
      const data: Assessment = await response.json();
      // Add or update the assessment in the local state for consistency
      setAssessments(prev => {
        const index = prev.findIndex(a => a.id === data.id);
        if (index > -1) {
          const newState = [...prev];
          newState[index] = data;
          return newState;
        }
        return [data, ...prev];
      });
      return data;
    } catch (e: any) {
      console.error("Failed to fetch assessment by ID", e);
      // Do not set the global error for a single fetch failure
      return null;
    }
  };

  const createAssessment = async (assessmentData: Omit<Assessment, 'id' | 'user_id' | 'report'> & { report?: AssessmentReport, manual_form?: ManualFormData }): Promise<Assessment> => {
     if (!isAuthenticated) throw new Error("User not authenticated");
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assessment.');
      }

      const newAssessment: Assessment = await response.json();
      setAssessments(prev => [newAssessment, ...prev]);
      return newAssessment;
    } catch(err: any) {
      console.error("Error creating assessment:", err);
      setError(err.message);
      throw err;
    }
  }

  const createAIAssessment = async (report: AssessmentReport, projectDetails: {name: string, location: string}): Promise<Assessment> => {
    const newAssessmentData = {
      project_name: projectDetails.name,
      location: projectDetails.location,
      date: new Date().toISOString(),
      // FIX: Explicitly cast 'type' to prevent widening to 'string' which causes a type error.
      type: 'AI' as 'AI',
      report,
    };
    return createAssessment(newAssessmentData);
  };

  const createManualAssessment = async (
    projectDetails: { name: string; location: string; assessmentType: AssessmentType },
    formData: ManualFormData
  ): Promise<Assessment> => {
    const report: AssessmentReport = {
        assessmentTitle: `Manual ${projectDetails.assessmentType}`,
        projectSummary: `This is a manually created record for the '${projectDetails.name}' project located in ${projectDetails.location}. All details and findings for this assessment are recorded in the attached form.`,
        legalFramework: [],
        potentialImpacts: [],
        mitigationMeasures: [],
        stakeholderEngagementPlan: 'Managed externally as per the attached manual form.',
        recommendations: 'Contained within the attached manual form.',
    };

    const newAssessmentData = {
      project_name: projectDetails.name,
      location: projectDetails.location,
      date: new Date().toISOString(),
      // FIX: Explicitly cast 'type' to prevent widening to 'string' which causes a type error.
      type: 'Manual' as 'Manual',
      report,
      manual_form: formData,
    };
    return createAssessment(newAssessmentData);
  };

  const value = {
    assessments,
    isLoading,
    error,
    getAssessmentById,
    fetchAssessmentById,
    createAIAssessment,
    createManualAssessment,
  };

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
};

export const useAssessments = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessments must be used within an AssessmentProvider');
  }
  return context;
};