
import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

const getOutlinePrompt = (
    projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    let specificInstruction = '';
    if (projectDetails.assessmentType === 'Cumulative') {
        specificInstruction = `
This is a "Cumulative" impact assessment. The report must analyze the combined, incremental effects of the proposed project alongside other past, present, and reasonably foreseeable future projects in the area. The outline should include sections for identifying other relevant projects, defining spatial and temporal boundaries, and assessing the overall cumulative impact on specific environmental and social resources.
`;
    }

    return `
    Based on the following project details for a "${projectDetails.assessmentType}" impact assessment in Kenya, generate a standard list of main section titles for a comprehensive report.
    ${specificInstruction}
    ### Project Details:
    - **Project Name:** ${projectDetails.projectName}
    - **Project Proponent:** ${projectDetails.projectProponent}
    - **Location:** ${projectDetails.location}, Kenya
    - **Project Type:** ${projectDetails.projectType}
    - **Description:** ${projectDetails.description}

    Return ONLY a numbered list of section titles. Do not add any other text.
    `;
};

const getFullReportPrompt = (
    projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
    fullOutline: string[]
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = projectDetails;
    const outlineString = fullOutline.map(title => `- ${title}`).join('\n');

    let specificInstruction = '';
    if (assessmentType === 'Cumulative') {
        specificInstruction = `
**Important:** For this "Cumulative" assessment, ensure your analysis in each relevant section considers the incremental impact of this project in combination with other past, present, and foreseeable projects. The discussion should focus on the total, additive, and synergistic effects on environmental resources, not just the impacts of this single project in isolation.
`;
    }

    return `
    Write the full report based on the project details below and adhering strictly to the provided report structure. For each section in the outline, provide detailed and thorough content. Format each section title as a Markdown heading (e.g., "## Introduction").
    ${specificInstruction}
    ### Project Details:
    - **Project Name:** ${projectName}
    - **Project Proponent:** ${projectProponent}
    - **Location:** ${location}, Kenya
    - **Project Type:** ${projectType}
    - **Assessment Type:** ${assessmentType}
    - **Detailed Description:** ${description}

    ### Report Structure to Follow:
    ${outlineString}

    Generate the complete report now. Do not repeat the project details in the report body. Begin directly with the first section.
    `;
};


const streamResponse = async (stream: AsyncGenerator<any>, responseStream: ReadableStreamDefaultController) => {
    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            responseStream.enqueue(new TextEncoder().encode(chunkText));
        }
    }
};

export default async (req: Request, context: Context) => {
    const { API_KEY } = process.env;
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { type, details, messages } = await req.json();
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    if (type === 'assessment') {
                        // 1. Generate the report outline using a simple string prompt for robustness.
                        const outlinePrompt = getOutlinePrompt(details);
                        
                        const outlineResponse = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: outlinePrompt,
                            config: {
                                systemInstruction: "You are an expert report structurer. You generate lists of section titles for professional reports based on a type and context.",
                            }
                        });

                        const outlineText = outlineResponse.text;
                        const sectionTitles = outlineText.split('\n').map(s => s.replace(/^- /, '').replace(/^\d+\.\s*/, '').trim()).filter(Boolean);

                        if (sectionTitles.length < 3) { // Sanity check for a valid outline
                            throw new Error("Failed to generate a valid report outline from the AI.");
                        }

                        // 2. Generate the full report based on the outline.
                        const fullReportPrompt = getFullReportPrompt(details, sectionTitles);
                        
                        const reportStream = await ai.models.generateContentStream({
                            model: 'gemini-2.5-flash',
                            contents: fullReportPrompt,
                             config: {
                                systemInstruction: "Act as a senior Environmental Scientist registered with NEMA (National Environment Management Authority) in Kenya. You are writing a professional, comprehensive, and complete impact assessment report.",
                            }
                        });

                        await streamResponse(reportStream, controller);
                        controller.enqueue(new TextEncoder().encode("\n\n--- END OF REPORT ---"));

                    } else if (type === 'chat') {
                        // Ensure history starts with a user message for chat
                        const validHistory = messages.slice();
                        if (validHistory.length > 0 && validHistory[0].role !== 'user') {
                            validHistory.shift(); 
                        }
                        
                        const contents: Content[] = validHistory.map((msg: {role: 'user' | 'model', text: string}) => ({
                            role: msg.role,
                            parts: [{ text: msg.text }]
                        }));

                        if (contents.length === 0) {
                             throw new Error("No user message found to send.");
                        }
                        
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
                    
                    // If we reached here without errors, close the stream successfully.
                    controller.close();

                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error in Stream:", error);
                    // This will cause the client's `reader.read()` promise to reject,
                    // allowing for proper error handling on the frontend.
                    controller.error(new Error("An error occurred while communicating with the AI."));
                }
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (e) {
        const error = e as Error;
        console.error("Proxy function error:", error);
        return new Response(JSON.stringify({ error: "Invalid request body or internal server error." }), { status: 400 });
    }
};
