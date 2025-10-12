// src/utils/promptBuilder.ts

import { Assessment } from '../types';
import { REPORT_SECTIONS } from '../config/ai';

/**
 * Builds the initial setup prompt.
 * This provides the AI with all the context for the report but asks it only to acknowledge
 * receipt of the information. This is a faster, more reliable initial step than asking for
 * generation immediately.
 * @param details - The project details from the user form.
 * @returns A string containing the setup prompt.
 */
export const getSetupPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

    const standardSections = REPORT_SECTIONS.map(s => `- **${s}**`).join('\n');

    let typeSpecificGuidance = '';
    switch (assessmentType) {
        case 'Environmental':
            typeSpecificGuidance = `Within the 'Impact Assessment' section, focus specifically on: ecosystems, biodiversity (flora and fauna), water resources (quality and quantity), soil quality, air quality, and noise pollution.`;
            break;
        case 'Social':
            typeSpecificGuidance = `Within the 'Impact Assessment' section, focus specifically on: community displacement, local employment opportunities, cultural heritage sites, public services (schools, hospitals), social equity, and community cohesion.`;
            break;
        case 'Health':
            typeSpecificGuidance = `Within the 'Impact Assessment' section, focus specifically on: public health impacts from air and water pollution, noise-related stress, changes in disease vectors, and impacts on local food and water sources.`;
            break;
        case 'Climate':
            typeSpecificGuidance = `Within the 'Impact Assessment' section, focus specifically on: the project's greenhouse gas (GHG) emissions (carbon footprint), its vulnerability to climate change impacts (e.g., increased flooding, drought), and its alignment with Kenya's climate goals.`;
            break;
        case 'Cumulative':
            typeSpecificGuidance = `
This is a **Cumulative Impact Assessment**. Your analysis must be comprehensive.
Within the 'Impact Assessment' section, you must:
1.  **Identify Other Projects**: Discuss the combined effects of this project with other past, present, and reasonably foreseeable future projects in the same geographical area.
2.  **Analyze Pathways**: Evaluate how the impacts from different projects might interact (e.g., multiple projects drawing water from the same river).
3.  **Assess Additive Effects**: Detail the total impact from all projects combined (e.g., total habitat loss).
4.  **Assess Synergistic Effects**: Analyze where the combined impact is greater than the sum of individual impacts (e.g., minor pollutants from two sources combining to create a major health hazard).
5.  **Define Boundaries**: Clearly state the geographical and time boundaries used for this cumulative analysis.`;
            break;
    }

    return `
**CONTEXT FOR UPCOMING TASK**:
I will be asking you to generate a professional impact assessment report, section by section. First, you must review and understand all the following context.

**PROJECT DETAILS**:
- **Project Name**: ${projectName}
- **Proponent**: ${projectProponent}
- **Location**: ${location}, Kenya
- **Project Type**: ${projectType}
- **Description**: ${description}

**FULL REPORT STRUCTURE**:
The final report will include these sections. I will ask for them one at a time.
${standardSections}

**SPECIFIC FOCUS FOR THIS "${assessmentType}" ASSESSMENT**:
${typeSpecificGuidance}

**CRITICAL INSTRUCTIONS FOR YOU**:
1.  **Be Comprehensive**: When you generate sections, ensure they contain thorough, expert-level analysis based on the project details.
2.  **Use Markdown**: Format the entire report using Markdown for clarity (headings, lists, bold text).
3.  **Current Task**: Your immediate and ONLY task is to acknowledge that you have received and understood all this context. Respond with a short confirmation message, like "I have received the project details and am ready to begin generating the report sections." Do NOT generate any part of the report yet.
`;
};
