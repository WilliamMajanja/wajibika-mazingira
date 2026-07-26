export type Page = 'assessment' | 'chat' | 'locker' | 'carbon' | 'market' | 'governance' | 'zanzibar' | 'passport' | 'wallet' | 'legal' | 'privacy';

export type LegalCategory = 'environmental' | 'land' | 'water' | 'energy' | 'planning' | 'regulations';

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalAct {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  actNumber: string;
  category: LegalCategory;
  description: string;
  jurisdiction: string;
  status: 'in_force' | 'repealed' | 'amended';
  dateEnacted: string;
  dateCommenced?: string;
  parts: { title: string; summary: string }[];
  keyProvisions: { section: string; description: string; penalty?: string }[];
  enforcingAgency: string;
  relatedLaws: string[];
  penalties?: string;
}

export type AssessmentType = 'Environmental' | 'Social' | 'Health' | 'Climate' | 'Cumulative' | 'Carbon_Sequestration' | 'Project_Monitoring' | 'Community_Engagement' | 'Compliance_Verification' | 'Financial_Analysis' | 'Risk_Assessment';

export interface Evidence {
  id: string;
  type: 'image' | 'text';
  name: string;
  data: string;
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
  createdAt: string;
  assessorName?: string;
  assessorType?: string;
  evidence?: Evidence[];
}

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

// ---- Carbon Credit System Types ----

export type CarbonProjectType = 'reforestation' | 'afforestation' | 'conservation' | 'renewable_energy' | 'soil_carbon' | 'blue_carbon' | 'agroforestry' | 'other';

export type CarbonProjectStatus = 'pending' | 'active' | 'verified' | 'completed';

export interface CarbonProject {
  id: string;
  name: string;
  description: string;
  location: string;
  projectType: CarbonProjectType;
  areaHectares: number;
  carbonSequestrationRate: number;
  startDate: string;
  status: CarbonProjectStatus;
  totalCreditsIssued: number;
  creditsAvailable: number;
  verificationBody?: string;
  methodology?: string;
  sdgContributions: string[];
  images?: Evidence[];
  totalTonnesSequestered: number;
  validator?: string;
  lastVerificationDate?: string;
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  projectName: string;
  projectType: CarbonProjectType;
  vintage: number;
  tonnesCO2: number;
  pricePerTonne: number;
  status: 'available' | 'listed' | 'retired' | 'pending_verification';
  serialNumber: string;
  certificationStandard: string;
  issuanceDate: string;
  retirementDate?: string;
  retiree?: string;
  retirementReason?: string;
}

export interface CarbonPricePoint {
  timestamp: string;
  price: number;
  volume: number;
  projectType?: CarbonProjectType;
}

export interface MarketOrder {
  id: string;
  type: 'buy' | 'sell';
  creditId?: string;
  projectType?: CarbonProjectType;
  pricePerTonne: number;
  tonnes: number;
  filledTonnes: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  createdAt: string;
  userId?: string;
}

export interface CarbonMetrics {
  totalProjects: number;
  activeProjects: number;
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  currentAveragePrice: number;
  priceChange24h: number;
  totalAreaRestored: number;
  totalTonnesSequestered: number;
  priceHistory: CarbonPricePoint[];
}

// ---- Governance Types ----

export type ProposalCategory = 'carbon_standard' | 'pricing' | 'project_approval' | 'parameter_change' | 'funding' | 'other';

export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: string;
  endDate: string;
  status: ProposalStatus;
  category: ProposalCategory;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorum: number;
  totalVotingPower: number;
  executedAt?: string;
}

export interface Vote {
  proposalId: string;
  voter: string;
  vote: 'for' | 'against' | 'abstain';
  votingPower: number;
  timestamp: string;
}

export interface GovernanceMetrics {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  totalVoters: number;
  averageParticipation: number;
}

// ---- User Portfolio ----

export interface CarbonPortfolio {
  ownedCredits: { creditId: string; quantity: number; acquisitionDate: string }[];
  stakedCredits: { creditId: string; quantity: number; stakeDate: string; unlockDate: string }[];
  totalSequestered: number;
  totalRetired: number;
  governanceTokens: number;
}

// ---- VEIN Sense & Carbon Passport Types ----

export type SensorType = 'acoustic' | 'visual' | 'salinity' | 'water_level' | 'biomass' | 'weather' | 'gps' | 'water_quality';

export interface VeinSenseDevice {
  id: string;
  name: string;
  firmwareVersion: string;
  calibrationStatus: 'calibrated' | 'pending' | 'expired';
  lastCalibration: string;
  sensors: SensorType[];
  location: { latitude: number; longitude: number };
  installedAt: string;
  batteryLevel: number;
}

export interface SignedObservation {
  id: string;
  deviceId: string;
  sensorType: SensorType;
  timestamp: string;
  value: number;
  unit: string;
  signature: string;
  minAnchoredAt?: string;
  minTxId?: string;
}

export interface EdgeAiOutput {
  id: string;
  deviceId: string;
  modelName: string;
  inferenceTimestamp: string;
  result: string;
  confidence: number;
  metrics: Record<string, number>;
}

export type PassportEventType = 'restoration' | 'degradation' | 'monitoring' | 'verification' | 'intervention';

export interface PassportEvent {
  id: string;
  type: PassportEventType;
  timestamp: string;
  description: string;
  actor: string;
  evidenceRefs: string[];
  minTxId?: string;
}

export interface CommunityVerification {
  id: string;
  passportId: string;
  verifier: string;
  verifierRole: string;
  timestamp: string;
  status: 'verified' | 'disputed' | 'pending';
  notes: string;
  signature: string;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  actor: string;
  minTxId: string;
  details: string;
}

export interface CarbonPassport {
  id: string;
  projectId: string;
  projectName: string;
  ecosystemLocation: string;
  boundary: { latitude: number; longitude: number }[];
  device: VeinSenseDevice;
  observations: SignedObservation[];
  edgeAiOutputs: EdgeAiOutput[];
  totalSequestered: number;
  lastUpdated: string;
  events: PassportEvent[];
  verifications: CommunityVerification[];
  auditTrail: AuditTrailEntry[];
  status: 'active' | 'pending' | 'archived';
  createdAt: string;
}
