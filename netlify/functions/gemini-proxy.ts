
import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

const getOutlinePrompt = (
    projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    return `
    Based on the following project details for a "${projectDetails.assessmentType}" impact assessment in Kenya, generate a standard list of main section titles for a comprehensive report.
    
    ### Project Details:
    - **Project Name:** ${projectDetails.projectName}
    - **Project Proponent:** ${projectDetails.projectProponent}
    - **Location:** ${projectDetails.location}, Kenya
    - **Project Type:** ${projectDetails.projectType}
    - **Description:** ${projectDetails.description}

    Return ONLY a numbered list of section titles. Do not add any other text.
    `;
};

const getSectionPrompt = (
    sectionTitle: string, 
    projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
    fullOutline: string[]
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = projectDetails;

    return `
    Act as a senior Environmental Scientist registered with NEMA (National Environment Management Authority) in Kenya.
    You are writing a professional impact assessment report. The overall structure of the report is: ${fullOutline.join(', ')}.

    Your current task is to write ONLY the content for the following section:

    ### Section: "${sectionTitle}"

    Base your writing on the project details provided below. Be thorough, professional, and use a formal tone suitable for an official report. Do not repeat the section title in your response.

    ### Project Details:
    - **Project Name:** ${projectName}
    - **Project Proponent:** ${projectProponent}
    - **Location:** ${location}, Kenya
    - **Project Type:** ${projectType}
    - **Assessment Type:** ${assessmentType}
    - **Detailed Description:** ${description}

    Generate the content for the "${sectionTitle}" section now.
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
                        // 1. Generate the report outline
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

                        // 2. Generate each section and stream it
                        for (const title of sectionTitles) {
                            // Stream the section title as a Markdown heading
                            const titleMarkdown = `\n## ${title}\n\n`;
                            controller.enqueue(new TextEncoder().encode(titleMarkdown));

                            // Create a prompt for the specific section content
                            const sectionPrompt = getSectionPrompt(title, details, sectionTitles);
                            const sectionStream = await ai.models.generateContentStream({
                                model: 'gemini-2.5-flash',
                                contents: sectionPrompt
                            });

                            // Stream the generated content for the section
                            for await (const chunk of sectionStream) {
                                const chunkText = chunk.text;
                                if (chunkText) {
                                    controller.enqueue(new TextEncoder().encode(chunkText));
                                }
                            }
                        }

                        // 3. Add the end-of-report marker to signal completion
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
                        controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: "Invalid request type" })));
                    }
                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error:", error);
                    // Do not expose detailed internal errors to the client
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: "An error occurred while communicating with the AI." })));
                } finally {
                    controller.close();
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
