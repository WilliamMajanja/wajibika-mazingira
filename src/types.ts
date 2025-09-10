export type Page = 'assessment' | 'chat' | 'locker';

export type AssessmentType = 'Environmental' | 'Social' | 'Health' | 'Climate' | 'Cumulative';

export interface Assessment {
  id: string;
  projectName: string;
  projectProponent: string;
  location: string;
  projectType: string;
  description: string;
  assessmentType: AssessmentType;
  report: string;
  createdAt: string; // ISO string date
  assessorName?: string;
  assessorType?: string;
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}