
import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

// A single, robust prompt generation function for all assessment types.
const getAssessmentPrompt = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

    let typeSpecificInstructions = '';
    switch (assessmentType) {
        case 'Environmental':
            typeSpecificInstructions = 'Focus on the project\'s impact on local ecosystems, biodiversity, water sources, air quality, and noise levels.';
            break;
        case 'Social':
            typeSpecificInstructions = 'Focus on the project\'s effects on the local community, including displacement, employment, cultural heritage, public services, and social equity.';
            break;
        case 'Health':
            typeSpecificInstructions = 'Focus on the potential health impacts on the community, such as those from air and water pollution, noise, and changes to access to healthcare or food sources.';
            break;
        case 'Climate':
            typeSpecificInstructions = 'Focus on the project\'s carbon footprint, greenhouse gas emissions, and its vulnerability or resilience to climate change effects like flooding or drought.';
            break;
        case 'Cumulative':
            typeSpecificInstructions = `This is a "Cumulative" assessment. Your analysis MUST consider the incremental impact of this project in combination with other past, present, and reasonably foreseeable projects in the area. The discussion should focus on the total, additive, and synergistic effects on environmental and social resources, not just the impacts of this single project in isolation.`;
            break;
    }

    return `
    As a senior Environmental Scientist registered with NEMA (National Environment Management Authority) in Kenya, write a professional, comprehensive, and complete "${assessmentType}" impact assessment report.

    Your report must be well-structured with clear sections formatted in Markdown. It must be detailed, thorough, and based on the project details provided below.

    **Primary Focus for this Assessment Type:**
    ${typeSpecificInstructions}

    **Project Details:**
    - **Project Name:** ${projectName}
    - **Project Proponent:** ${projectProponent}
    - **Location:** ${location}, Kenya
    - **Project Type:** ${projectType}
    - **Detailed Description:** ${description}

    **Instructions:**
    1.  Create a standard report structure including sections like Introduction, Project Description, Baseline Conditions, Impact Assessment, Mitigation Measures, and Conclusion.
    2.  Write detailed content for each section based on the project details and your expertise.
    3.  Do not repeat the project details list in the report body. Begin directly with the first section.
    4.  Ensure the report is complete.
    5.  Conclude the entire report with the exact phrase on a new line: "*** END OF REPORT ***"
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
                            contents: prompt,
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
                    // This error will be caught by the service on the frontend.
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
