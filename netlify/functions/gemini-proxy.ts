import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";

const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_SYSTEM_INSTRUCTION = "You are 'Mazingira Rafiki', a helpful, anonymous AI assistant for a Kenyan community forum. Your goal is to facilitate constructive discussions about environmental and social impacts of local projects. Be neutral, informative, and encouraging. Do not provide legal advice. Keep responses concise and clear. All conversations are in English.";

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

        if (type !== 'chat' || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid request: 'type' must be 'chat' and 'messages' must be a non-empty array." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    const ai = new GoogleGenAI({ apiKey: API_KEY });

                    const history: Content[] = messages.slice(0, -1).map((msg: {role: 'user' | 'model', text: string}) => ({
                        role: msg.role,
                        parts: [{ text: msg.text }]
                    }));

                    const chat = ai.chats.create({
                        model: GEMINI_MODEL,
                        config: {
                            systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION
                        },
                        history: history
                    });

                    const lastMessage = messages[messages.length - 1].text;
                    const resultStream = await chat.sendMessageStream({ message: lastMessage });
                    await streamResponse(resultStream, controller);
                    
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
