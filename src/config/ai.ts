// src/config/ai.ts

// Centralized configuration for AI models and prompts

// The AI model to use for all features
export const GEMINI_MODEL = 'gemini-2.5-flash';

// System instruction for the Assessment Generator AI persona
export const ASSESSMENT_EXPERT_INSTRUCTION = "You are an expert Environmental Scientist, fully accredited by NEMA in Kenya. Your task is to generate a professional, detailed, and comprehensive impact assessment report based on the user's provided details. You will be asked to generate the report section by section.";

// Sections for the assessment report, to be requested sequentially
export const REPORT_SECTIONS = [
    '1.0 Introduction',
    '2.0 Project Description',
    '3.0 Baseline Conditions',
    '4.0 Impact Assessment and Analysis',
    '5.0 Mitigation Measures',
    '6.0 Conclusion and Recommendations',
];
