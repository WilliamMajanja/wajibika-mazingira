import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

const getAssessmentPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

    const standardSections = `
- **1.0 Introduction**: Briefly introduce the project and the purpose of this assessment.
- **2.0 Project Description**: Provide a detailed description of the project based on the user's input.
- **3.0 Baseline Conditions**: Describe the existing environmental, social, and economic conditions at the project location before the project begins.
- **4.0 Impact Assessment and Analysis**: The core of the report. Analyze the potential positive and negative impacts of the project.
- **5.0 Mitigation Measures**: Propose specific, actionable measures to prevent, reduce, or offset the identified negative impacts.
- **6.0 Conclusion and Recommendations**: Summarize the key findings and provide a concluding recommendation.`;

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
**TASK**: Generate a report based on the following details.

**PROJECT DETAILS**:
- **Project Name**: ${projectName}
- **Proponent**: ${projectProponent}
- **Location**: ${location}, Kenya
- **Project Type**: ${projectType}
- **Description**: ${description}

**REQUIRED REPORT STRUCTURE AND CONTENT**:
You must generate a report in Markdown format that includes the following sections, with detailed content for each:
${standardSections}

**SPECIFIC FOCUS FOR THIS "${assessmentType}" ASSESSMENT**:
${typeSpecificGuidance}

**CRITICAL INSTRUCTIONS**:
1.  **Start Directly**: Begin the report immediately with the first Markdown heading (e.g., \`# 1.0 Introduction\`). Do NOT repeat the project details list.
2.  **Be Comprehensive**: Ensure every section is present and contains thorough, expert-level analysis based on the project details provided.
3.  **Use Markdown**: Format the entire report using Markdown for clarity (headings, lists, bold text).
4.  **Concluding Marker**: You MUST end the entire report with the exact phrase on a new line: \`*** END OF REPORT ***\`
`;
};


// Helper to stream Gemini response to the client
const streamResponse = async (stream: AsyncGenerator<any>, controller: ReadableStreamDefaultController) => {
    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            controller.enqueue(new TextEncoder().encode(chunkText));
        }
    }
};

export default async (req: Request, context: Context) => {
    const { API_KEY } = process.env;
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { type, details, messages } = await req.json();
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    if (type === 'assessment') {
                        const prompt = getAssessmentPrompt(details);
                        
                        const resultStream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: [{ role: 'user', parts: [{ text: prompt }] }],
                            config: {
                                systemInstruction: "You are an expert Environmental Scientist, fully accredited by NEMA in Kenya. Your task is to generate a professional, detailed, and comprehensive impact assessment report based on the user's provided details.",
                            }
                        });
                        await streamResponse(resultStream, controller);

                    } else if (type === 'chat') {
                        const contents: Content[] = messages.map((msg: {role: 'user' | 'model', text: string}) => ({
                            role: msg.role,
                            parts: [{ text: msg.text }]
                        }));
                        
                        const resultStream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: contents,
                            config: {
                                systemInstruction: "You are 'Mazingira Rafiki', a helpful, anonymous AI assistant for a Kenyan community forum. Your goal is to facilitate constructive discussions about environmental and social impacts of local projects. Be neutral, informative, and encouraging. Do not provide legal advice. Keep responses concise and clear. All conversations are in English."
                            },
                        });
                        await streamResponse(resultStream, controller);

                    } else {
                        throw new Error(`Invalid request type: ${type}`);
                    }
                    controller.close();
                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error in Stream:", error);
                    // Use controller.error to propagate the error to the client fetch call
                    controller.error(new Error("An error occurred while communicating with the AI."));
                }
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (e) {
        const error = e as Error;
        console.error("Proxy function setup error:", error);
        return new Response(JSON.stringify({ error: "Invalid request body or internal server error." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
};