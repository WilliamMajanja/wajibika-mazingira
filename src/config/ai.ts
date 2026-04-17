// src/config/ai.ts

// Centralized configuration for AI models and prompts

export const MODELS = {
    // Fast, for low-latency chat
    flash_lite: 'gpt-4o-mini',
    // Standard, balanced model for chat and analysis
    flash: 'gpt-4o',
    // Advanced, for complex reasoning and deep analysis
    pro: 'gpt-4o',
    // Text-to-Speech – handled by the browser SpeechSynthesis API
    tts: 'browser-speechsynthesis',
};


// System instruction for the Assessment Generator AI persona
export const ASSESSMENT_EXPERT_INSTRUCTION = "You are an expert Environmental Scientist, fully accredited by NEMA in Kenya. Your task is to generate a professional, detailed, and comprehensive impact assessment report based on the user's provided details. You will be asked to generate the report section by section.";

// System instruction for the Community Chat AI persona
export const CHAT_DEFAULT_SYSTEM_INSTRUCTION = "You are 'Mazingira Rafiki', a helpful, anonymous AI assistant for a Kenyan community forum. Your goal is to facilitate constructive discussions about environmental and social impacts of local projects. Be neutral, informative, and encouraging. Do not provide legal advice. Keep responses concise and clear. All conversations are in English.";

// Sections for the assessment report, to be requested sequentially
export const REPORT_SECTIONS = [
    '1.0 Introduction',
    '2.0 Project Description',
    '3.0 Baseline Conditions',
    '4.0 Impact Assessment and Analysis',
    '5.0 Mitigation Measures',
    '6.0 Conclusion and Recommendations',
];
