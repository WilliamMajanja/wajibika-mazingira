import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Evidence } from '../types';

interface EvidenceContextType {
  evidence: Evidence[];
  isLoading: boolean;
  error: string | null;
  addEvidence: (newEvidence: Omit<Evidence, 'id' | 'submitted_at'>) => Promise<void>;
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

  const addEvidence = async (newEvidenceData: Omit<Evidence, 'id' | 'submitted_at'>) => {
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
      setEvidence(prev => [createdEvidence, ...prev]);
    } catch(err: any) {
      console.error("Error creating evidence:", err);
      setError(err.message);
      throw err;
    }
  };
  
  const value = {
    evidence,
    isLoading,
    error,
    addEvidence,
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
