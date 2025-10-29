export type Page = 'assessment' | 'chat' | 'locker';

export type AssessmentType = 'Environmental' | 'Social' | 'Health' | 'Climate' | 'Cumulative';

export interface Evidence {
  id: string;
  type: 'image';
  name: string;
  data: string; // base64 data URL
  analysis?: string;
  isAnalyzing?: boolean;
}

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
  evidence?: Evidence[];
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}