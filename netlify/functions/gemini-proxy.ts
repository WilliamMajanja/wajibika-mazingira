import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { Context } from "@netlify/functions";

const { API_KEY } = process.env;

// Helper to stream text response
const streamTextResponse = async (stream: AsyncGenerator<any>, controller: ReadableStreamDefaultController) => {
    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            controller.enqueue(new TextEncoder().encode(chunkText));
        }
    }
};

// Main handler
export default async (req: Request, context: Context) => {
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const body = await req.json();
        const { task, stream = true } = body;

        const ai = new GoogleGenAI({ apiKey: API_KEY });

        // Non-streaming tasks that return a single JSON payload
        if (!stream) {
            let response: GenerateContentResponse | null = null;
            let jsonResponseData: object | null = null;

            switch (task) {
                case 'groundedSearch':
                case 'groundedMaps': {
                    const { messages, model, systemInstruction, latLng } = body;
                    const contents = messages.map((msg: { role: string; text: string; }) => ({ role: msg.role, parts: [{ text: msg.text }] }));
                    
                    const tools = task === 'groundedSearch' ? [{ googleSearch: {} }] : [{ googleMaps: {} }];
                    const toolConfig = (task === 'groundedMaps' && latLng) ? { retrievalConfig: { latLng } } : undefined;

                    response = await ai.models.generateContent({
                        model: model,
                        contents: contents,
                        config: { 
                            systemInstruction, 
                            tools, 
                            ...(toolConfig && { toolConfig })
                        }
                    });
                    
                    jsonResponseData = {
                        text: response.text,
                        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                    };
                    break;
                }
                case 'tts': {
                    const { text, model } = body;
                     response = await ai.models.generateContent({
                        model: model,
                        contents: [{ parts: [{ text: `Say it naturally: ${text}` }] }],
                        config: {
                            responseModalities: [Modality.AUDIO],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                                },
                            },
                        },
                    });
                    const audioContent = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    jsonResponseData = { audioContent };
                    break;
                }
                default:
                    throw new Error(`Unsupported non-streaming task: ${task}`);
            }
            return new Response(JSON.stringify(jsonResponseData), { headers: { 'Content-Type': 'application/json' } });
        }

        // Streaming tasks
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    let responseStream: AsyncGenerator<GenerateContentResponse, any, any>;
                    
                    switch (task) {
                        case 'chat':
                        case 'complexGeneration': {
                             const { messages, model, systemInstruction } = body;
                             const contents = messages.map((msg: { role: string; text: string; }) => ({ role: msg.role, parts: [{ text: msg.text }] }));
                             responseStream = await ai.models.generateContentStream({
                                model: model,
                                contents: contents,
                                config: {
                                    systemInstruction: systemInstruction,
                                    ...(task === 'complexGeneration' && { thinkingConfig: { thinkingBudget: 32768 } })
                                }
                             });
                             break;
                        }
                        case 'analyzeImage': {
                            const { prompt, image, mimeType, model } = body;
                            const imagePart = { inlineData: { data: image, mimeType: mimeType } };
                            const contents = {
                                role: 'user',
                                parts: [{ text: prompt }, imagePart]
                            };
                            responseStream = await ai.models.generateContentStream({
                                model: model,
                                contents: contents,
                            });
                            break;
                        }
                        case 'transcribeAudio': {
                            const { audio, mimeType, model } = body;
                            const audioPart = { inlineData: { data: audio, mimeType: mimeType } };
                            const contents = {
                                role: 'user',
                                parts: [{ text: "Transcribe this audio recording accurately." }, audioPart]
                            };
                            responseStream = await ai.models.generateContentStream({
                                model: model,
                                contents: contents,
                            });
                            break;
                        }
                        default:
                            throw new Error(`Unsupported streaming task: ${task}`);
                    }

                    await streamTextResponse(responseStream, controller);
                    controller.close();
                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error in Stream:", error);
                    controller.error(error);
                }
            }
        });

        return new Response(readableStream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

    } catch (e) {
        const error = e as Error;
        console.error("Proxy function error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
};