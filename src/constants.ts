import { AssessmentType } from "./types";

export const APP_NAME = "Wajibika Mazingira";

export const ASSESSMENT_TYPES = [
  { id: 'EIA', name: AssessmentType.EIA },
  { id: 'CIA', name: AssessmentType.CIA },
  { id: 'SIA', name: AssessmentType.SIA },
  { id: 'HIA', name: AssessmentType.HIA },
];

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Defines the roles used in the application for RBAC.
export const ROLES = {
  ADMIN: 'Admin',
  PRACTITIONER: 'Practitioner',
};

// The namespaced claim used in the Auth0 JWT to store roles.
export const ROLES_CLAIM = 'https://wajibika.app/roles';