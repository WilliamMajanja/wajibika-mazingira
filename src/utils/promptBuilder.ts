// src/utils/promptBuilder.ts

import { Assessment } from '../types';
import { REPORT_SECTIONS } from '../config/ai';

/**
 * Builds the complex initial prompt for the assessment generator AI.
 * This function defines the structure, content, and instructions the AI needs to
 * generate the first section of the report.
 * @param details - The project details from the user form.
 * @param sectionToGenerate - The specific section the AI should generate now.
 * @returns A string containing the full, detailed prompt.
 */
export const getInitialAssessmentPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
    sectionToGenerate: string
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
**TASK**: You will generate a report based on the following details, section by section as I request them.

**PROJECT DETAILS**:
- **Project Name**: ${projectName}
- **Proponent**: ${projectProponent}
- **Location**: ${location}, Kenya
- **Project Type**: ${projectType}
- **Description**: ${description}

**FULL REPORT STRUCTURE**:
The final report will include these sections. You must generate them one at a time.
${standardSections}

**SPECIFIC FOCUS FOR THIS "${assessmentType}" ASSESSMENT**:
${typeSpecificGuidance}

**CRITICAL INSTRUCTIONS**:
1.  **Be Comprehensive**: Ensure every section is present and contains thorough, expert-level analysis based on the project details provided.
2.  **Use Markdown**: Format the entire report using Markdown for clarity (headings, lists, bold text).
3.  **Current Task**: Your immediate and ONLY task is to generate the content for the **"${sectionToGenerate}"** section. Start the response directly with the Markdown heading for this section (e.g., \`# 1.0 Introduction\`). Do NOT generate any other sections or introductory text.
`;
};
