export interface LegalFramework {
  statute: string;
  relevance: string;
}

export interface PotentialImpact {
  impactArea: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | string;
}

export interface MitigationMeasure {
  measure: string;
  implementation: string;
}

export interface AssessmentReport {
  assessmentTitle: string;
  projectSummary: string;
  legalFramework: LegalFramework[];
  potentialImpacts: PotentialImpact[];
  mitigationMeasures: MitigationMeasure[];
  stakeholderEngagementPlan: string;
  recommendations: string;
}

export enum AssessmentType {
    EIA = 'Environmental Impact Assessment (EIA)',
    CIA = 'Climate Impact Assessment (CIA)',
    SIA = 'Social Impact Assessment (SIA)',
    HIA = 'Health Impact Assessment (HIA)',
}

export interface EIAFormData {
  assessmentType: AssessmentType.EIA;
  environmentalSetting: string;
  potentialImpacts: string;
  mitigationMeasures: string;
  publicConsultationSummary: string;
}

export interface CIAFormData {
  assessmentType: AssessmentType.CIA;
  ghgEmissionsEstimate: string;
  climateVulnerability: string;
  adaptationMeasures: string;
  nccapAlignment: string;
}

export interface SIAFormData {
  assessmentType: AssessmentType.SIA;
  affectedCommunities: string;
  potentialSocialImpacts: string;
  communityEngagementPlan: string;
  benefitSharingMechanism: string;
}

export interface HIAFormData {
  assessmentType: AssessmentType.HIA;
  potentialHealthRisks: string;
  affectedPopulationGroups: string;
  healthSystemCapacity: string;
  healthMitigationMeasures: string;
}

export type ManualFormData = EIAFormData | CIAFormData | SIAFormData | HIAFormData;

export interface Assessment {
  id: string; 
  user_id: string;
  project_name: string;
  location: string;
  date: string;
  type: 'AI' | 'Manual';
  report: AssessmentReport;
  manual_form?: ManualFormData;
}

export interface Evidence {
  id: string;
  title: string;
  description: string;
  location: string;
  date_of_evidence: string;
  submitted_at: string;
  file_content?: string;
  file_mime_type?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AuthorInfo {
  id:string;
  name?: string;
  picture?: string;
}


export interface ForumMessage {
  id: string;
  thread_id: string;
  author: AuthorInfo;
  content: string;
  created_at: string;
}

export interface ForumThread {
  id:string;
  title: string;
  author: AuthorInfo;
  created_at: string;
  reply_count: number;
  last_reply_at?: string;
  messages?: ForumMessage[];
}