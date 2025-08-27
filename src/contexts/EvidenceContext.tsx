import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Evidence } from '../types';

interface EvidenceContextType {
  evidence: Evidence[]; // This will now hold only general (non-assessment-linked) evidence
  isLoading: boolean;
  error: string | null;
  addEvidence: (newEvidence: Omit<Evidence, 'id' | 'submitted_at'>) => Promise<Evidence>;
  getEvidenceForAssessment: (assessmentId: string) => Promise<Evidence[]>;
  summarizeEvidence: (evidenceId: string) => Promise<string>;
}

const EvidenceContext = createContext<EvidenceContextType | undefined>(undefined);

export const EvidenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch only general evidence for the main locker view
        const response = await fetch('/api/evidence');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch evidence from API.' }));
          throw new Error(errorData.error || 'Failed to fetch evidence.');
        }
        const data: Evidence[] = await response.json();
        setEvidence(data);
      } catch (e: any) {
        console.error("Failed to fetch evidence from API", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvidence();
  }, []);

  const addEvidence = async (newEvidenceData: Omit<Evidence, 'id' | 'submitted_at'>): Promise<Evidence> => {
    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvidenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit evidence.');
      }

      const createdEvidence: Evidence = await response.json();
      
      // Only add to context state if it's general evidence
      if (!createdEvidence.assessment_id) {
          setEvidence(prev => [createdEvidence, ...prev]);
      }
      return createdEvidence;

    } catch(err: any) {
      console.error("Error creating evidence:", err);
      setError(err.message);
      throw err;
    }
  };

  const getEvidenceForAssessment = async (assessmentId: string): Promise<Evidence[]> => {
     try {
        const response = await fetch(`/api/evidence?assessment_id=${assessmentId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to fetch evidence.' }));
            throw new Error(errorData.error);
        }
        return await response.json();
    } catch (e: any) {
        console.error("Failed to fetch assessment evidence:", e);
        // Do not set global error for this specific fetch
        return [];
    }
  };
  
  const summarizeEvidence = async (evidenceId: string): Promise<string> => {
      const response = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summarize', evidenceId })
      });

      const data = await response.json();
      if (!response.ok) {
          throw new Error(data.error || 'Failed to get summary.');
      }
      return data.summary;
  };

  const value = {
    evidence,
    isLoading,
    error,
    addEvidence,
    getEvidenceForAssessment,
    summarizeEvidence,
  };

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
};

export const useEvidence = (): EvidenceContextType => {
  const context = useContext(EvidenceContext);
  if (context === undefined) {
    throw new Error('useEvidence must be used within an EvidenceProvider');
  }
  return context;
};