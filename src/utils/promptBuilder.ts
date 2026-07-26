// src/utils/promptBuilder.ts

import { Assessment } from '../types';
import type { Language } from '../config/i18n';

export const getSectionPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
    sectionToGenerate: string,
    language?: Language,
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

    const isImpactSection = sectionToGenerate.includes('4.0') || sectionToGenerate.includes('Impact Assessment');

    let typeSpecificGuidance = '';
    switch (assessmentType) {
        case 'Environmental':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: ecosystems, biodiversity (flora and fauna), water resources (quality and quantity), soil quality, air quality, and noise pollution.`
                : `Ensure the content reflects an Environmental Impact Assessment perspective, considering ecological systems, natural resources, and environmental regulations.`;
            break;
        case 'Social':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: community displacement, local employment opportunities, cultural heritage sites, public services (schools, hospitals), social equity, and community cohesion.`
                : `Ensure the content reflects a Social Impact Assessment perspective, considering community welfare, cultural values, and social equity.`;
            break;
        case 'Health':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: public health impacts from air and water pollution, noise-related stress, changes in disease vectors, and impacts on local food and water sources.`
                : `Ensure the content reflects a Health Impact Assessment perspective, considering public health outcomes, disease ecology, and community well-being.`;
            break;
        case 'Climate':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: the project's greenhouse gas (GHG) emissions (carbon footprint), its vulnerability to climate change impacts (e.g., increased flooding, drought), and its alignment with Zanzibar's climate goals.`
                : `Ensure the content reflects a Climate Impact Assessment perspective, considering GHG emissions, climate resilience, and alignment with climate commitments.`;
            break;
        case 'Cumulative':
            typeSpecificGuidance = isImpactSection ? `
This is a **Cumulative Impact Assessment**. Your analysis for this section must be comprehensive.
1.  **Identify Other Projects**: Discuss the combined effects of this project with other past, present, and reasonably foreseeable future projects in the same geographical area.
2.  **Analyze Pathways**: Evaluate how the impacts from different projects might interact (e.g., multiple projects drawing water from the same river).
3.  **Assess Additive & Synergistic Effects**: Detail the total impact from all projects combined (additive) and analyze where the combined impact is greater than the sum of individual impacts (synergistic).
4.  **Define Boundaries**: Clearly state the geographical and time boundaries used for this cumulative analysis.`
                : `Ensure the content reflects a Cumulative Impact Assessment perspective, considering additive and synergistic effects across multiple projects in the area.`;
            break;
        case 'Carbon_Sequestration':
            typeSpecificGuidance = isImpactSection ? `
Your analysis must focus on:
1.  **Carbon Stock Assessment**: Estimate current and potential carbon stocks (above-ground biomass, below-ground biomass, soil organic carbon).
2.  **Sequestration Rate**: Estimate annual carbon sequestration potential in tonnes CO2e per hectare per year.
3.  **Methodology**: Reference appropriate carbon accounting methodologies (e.g., VCS, Gold Standard, Plan Vivo, CDM).
4.  **Leakage & Permanence**: Assess risks of carbon leakage and permanence of carbon storage.
5.  **Co-benefits**: Identify biodiversity, community livelihood, and SDG co-benefits.
6.  **MRV Framework**: Describe a monitoring, reporting, and verification framework.`
                : `Ensure the content reflects a Carbon Sequestration perspective, focusing on carbon stocks, sequestration potential, and carbon accounting standards.`;
            break;
        case 'Project_Monitoring':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: monitoring indicators and KPIs, data collection methodologies, reporting frequency and frameworks, baseline vs. actual comparisons, and adaptive management recommendations.`
                : `Ensure the content reflects a Project Monitoring perspective, considering performance tracking, data collection, and adaptive management.`;
            break;
        case 'Community_Engagement':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: stakeholder identification and mapping, Free Prior and Informed Consent (FPIC) processes, benefit-sharing mechanisms, grievance redress mechanisms, and community participation frameworks.`
                : `Ensure the content reflects a Community Engagement perspective, considering stakeholder participation, local ownership, and inclusive decision-making.`;
            break;
        case 'Compliance_Verification':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: regulatory requirements and permits, certification standards (VCS, Gold Standard, Plan Vivo), audit findings and non-conformances, corrective action plans, and compliance timelines.`
                : `Ensure the content reflects a Compliance Verification perspective, considering regulatory adherence, certification requirements, and audit readiness.`;
            break;
        case 'Financial_Analysis':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: project capital and operational costs, revenue projections from carbon credits and other sources, return on investment (ROI) analysis, break-even analysis, carbon credit pricing assumptions, and financial risk assessment.`
                : `Ensure the content reflects a Financial Analysis perspective, considering project economics, revenue streams, and financial sustainability.`;
            break;
        case 'Risk_Assessment':
            typeSpecificGuidance = isImpactSection
                ? `Focus specifically on: hazard identification and classification, risk probability and consequence matrices, inherent vs. residual risk ratings, mitigation measures and controls, and contingency planning for high-priority risks.`
                : `Ensure the content reflects a Risk Assessment perspective, considering hazard identification, risk analysis, and mitigation planning.`;
            break;
    }

    const langInstruction = language && language === 'sw'
        ? '\n**LANGUAGE**: Respond entirely in Swahili (Kiswahili). All content must be in Swahili.'
        : '';

    return `
**TASK**:
Your task is to generate the content for a single section of a professional ${assessmentType} Impact Assessment report.

**CRITICAL INSTRUCTIONS**:
1.  **GENERATE ONLY ONE SECTION**: Your entire response must be ONLY the content for the section titled "**${sectionToGenerate}**".
2.  **START IMMEDIATELY**: Begin your response directly with the Markdown heading for this section (e.g., "### 1.0 Introduction"). Do NOT include any introductory text, pleasantries, or content from other sections.
3.  **USE FULL CONTEXT**: Base your analysis on all the project details provided below.
4.  **BE COMPREHENSIVE**: Ensure the content is detailed, professional, and reflects your expertise.
5.  **USE MARKDOWN**: Format the output using Markdown (headings, lists, bold).${langInstruction}
---
**FULL PROJECT CONTEXT**:

**Project Details**:
- **Project Name**: ${projectName}
- **Proponent**: ${projectProponent}
- **Location**: ${location}, Zanzibar
- **Project Type**: ${projectType}
- **Description**: ${description}

**Specific Focus for this "${assessmentType}" Assessment**:
${typeSpecificGuidance}
---

Now, generate ONLY the content for the "**${sectionToGenerate}**" section.
`;
};