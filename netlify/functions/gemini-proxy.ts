import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";

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
        const { type, messages, systemInstruction } = await req.json();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    if (type === 'chat') {
                        const ai = new GoogleGenAI({ apiKey: API_KEY });

                        const history: Content[] = messages.slice(0, -1).map((msg: {role: 'user' | 'model', text: string}) => ({
                            role: msg.role,
                            parts: [{ text: msg.text }]
                        }));

                        const chat = ai.chats.create({
                            model: 'gemini-2.5-flash',
                            config: {
                                systemInstruction: systemInstruction || "You are 'Mazingira Rafiki', a helpful, anonymous AI assistant for a Kenyan community forum. Your goal is to facilitate constructive discussions about environmental and social impacts of local projects. Be neutral, informative, and encouraging. Do not provide legal advice. Keep responses concise and clear. All conversations are in English."
                            },
                            history: history
                        });

                        const lastMessage = messages[messages.length - 1].text;
                        const resultStream = await chat.sendMessageStream({ message: lastMessage });
                        await streamResponse(resultStream, controller);

                    } else {
                        throw new Error(`Invalid request type: ${type}`);
                    }
                    controller.close();
                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error in Stream:", error);
                    controller.error(error);
                }
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (e) {
        const error = e as Error;
        console.error("Proxy function setup error:", error);
        return new Response(JSON.stringify({ error: error.message || "Invalid request body or internal server error." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
};