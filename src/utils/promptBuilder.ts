// src/utils/promptBuilder.ts

import { Assessment } from '../types';

/**
 * Builds a self-contained prompt for generating a single section of the assessment report.
 * This approach is stateless and ensures each API call is fast and independent,
 * preventing serverless function timeouts.
 *
 * @param details - The project details from the user form.
 * @param sectionToGenerate - The specific report section to generate (e.g., '1.0 Introduction').
 * @returns A string containing the complete, self-contained prompt for the AI.
 */
export const getSectionPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
    sectionToGenerate: string
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

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
This is a **Cumulative Impact Assessment**. Your analysis for this section must be comprehensive.
If generating the 'Impact Assessment' section, you must:
1.  **Identify Other Projects**: Discuss the combined effects of this project with other past, present, and reasonably foreseeable future projects in the same geographical area.
2.  **Analyze Pathways**: Evaluate how the impacts from different projects might interact (e.g., multiple projects drawing water from the same river).
3.  **Assess Additive & Synergistic Effects**: Detail the total impact from all projects combined (additive) and analyze where the combined impact is greater than the sum of individual impacts (synergistic).
4.  **Define Boundaries**: Clearly state the geographical and time boundaries used for this cumulative analysis.`;
            break;
    }

    return `
**TASK**:
Your task is to generate the content for a single section of a professional ${assessmentType} Impact Assessment report.

**CRITICAL INSTRUCTIONS**:
1.  **GENERATE ONLY ONE SECTION**: Your entire response must be ONLY the content for the section titled "**${sectionToGenerate}**".
2.  **START IMMEDIATELY**: Begin your response directly with the Markdown heading for this section (e.g., "### 1.0 Introduction"). Do NOT include any introductory text, pleasantries, or content from other sections.
3.  **USE FULL CONTEXT**: Base your analysis on all the project details provided below.
4.  **BE COMPREHENSIVE**: Ensure the content is detailed, professional, and reflects your expertise.
5.  **USE MARKDOWN**: Format the output using Markdown (headings, lists, bold).

---
**FULL PROJECT CONTEXT**:

**Project Details**:
- **Project Name**: ${projectName}
- **Proponent**: ${projectProponent}
- **Location**: ${location}, Kenya
- **Project Type**: ${projectType}
- **Description**: ${description}

**Specific Focus for this "${assessmentType}" Assessment**:
${typeSpecificGuidance}
---

Now, generate ONLY the content for the "**${sectionToGenerate}**" section.
`;
};