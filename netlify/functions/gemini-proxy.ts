import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

// A structured prompt is more reliable. We separate the persona/system instructions
// from the specific, immediate task.

const assessmentSystemInstruction = `You are a senior Environmental Scientist registered with NEMA (National Environment Management Authority) in Kenya. Your task is to write a professional, comprehensive impact assessment report. Your report must be well-structured with clear sections formatted in Markdown, including sections like Introduction, Project Description, Baseline Conditions, Impact Assessment, Mitigation Measures, and Conclusion. Write detailed content for each section based on your expertise and the provided project details.`;

const getAssessmentContent = (
    details: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = details;

    let typeSpecificFocus = '';
    switch (assessmentType) {
        case 'Environmental':
            typeSpecificFocus = 'Focus on the project\'s impact on local ecosystems, biodiversity, water sources, air quality, and noise levels.';
            break;
        case 'Social':
            typeSpecificFocus = 'Focus on the project\'s effects on the local community, including displacement, employment, cultural heritage, public services, and social equity.';
            break;
        case 'Health':
            typeSpecificFocus = 'Focus on the potential health impacts on the community, such as those from air and water pollution, noise, and changes to access to healthcare or food sources.';
            break;
        case 'Climate':
            typeSpecificFocus = 'Focus on the project\'s carbon footprint, greenhouse gas emissions, and its vulnerability or resilience to climate change effects like flooding or drought.';
            break;
        case 'Cumulative':
            typeSpecificFocus = `Your primary focus is a "Cumulative" analysis. Evaluate the project's impact in combination with other past, present, and foreseeable projects. Analyze the total additive and synergistic effects.`;
            break;
    }

    return `
    Generate a complete "${assessmentType}" impact assessment report for the following project.
    
    **Primary Focus:** ${typeSpecificFocus}

    **Project Details:**
    - Name: ${projectName}
    - Proponent: ${projectProponent}
    - Location: ${location}, Kenya
    - Type: ${projectType}
    - Description: ${description}

    Ensure the report is complete and well-structured. Do not repeat the project details list in the report body. Begin directly with the first section.
    Conclude the entire report with the exact phrase on a new line: "*** END OF REPORT ***"
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
                        const contents = getAssessmentContent(details);
                        const resultStream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: contents,
                             config: {
                                systemInstruction: assessmentSystemInstruction,
                            },
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