// src/services/geminiApiClient.ts
// Calls the Gemini API directly from the browser using the @google/genai SDK.
// The API key is read from the VITE_GEMINI_API_KEY environment variable at build time.

import { GoogleGenAI, Modality, type Part, type GenerateContentResponse } from "@google/genai";
import { MODELS } from "../config/ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const getAI = (): GoogleGenAI => {
    if (!API_KEY) {
        throw new Error(
            "Gemini API key is not configured. Set the VITE_GEMINI_API_KEY environment variable."
        );
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

// ---------------------------------------------------------------------------
// Streaming helper – returns a ReadableStream<Uint8Array> to keep the same
// interface that the rest of the app already consumes.
// ---------------------------------------------------------------------------

export const streamGeminiResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<ReadableStream<Uint8Array>> => {
    const ai = getAI();
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                let stream: AsyncGenerator<GenerateContentResponse>;

                switch (task) {
                    case "chat":
                    case "complexGeneration": {
                        const { messages, model, systemInstruction } = payload;
                        const contents = messages.map((msg: { role: string; text: string }) => ({
                            role: msg.role,
                            parts: [{ text: msg.text }],
                        }));
                        stream = await ai.models.generateContentStream({
                            model,
                            contents,
                            config: {
                                systemInstruction,
                                ...(task === "complexGeneration" && {
                                    thinkingConfig: { thinkingBudget: 32768 },
                                }),
                            },
                        });
                        break;
                    }
                    case "analyzeImage": {
                        const { prompt, image, mimeType, model } = payload;
                        const imagePart: Part = { inlineData: { data: image, mimeType } };
                        const textPart: Part = { text: prompt };
                        stream = await ai.models.generateContentStream({
                            model,
                            contents: [{ role: "user", parts: [textPart, imagePart] }],
                        });
                        break;
                    }
                    case "transcribeAudio": {
                        const { audio, mimeType, model } = payload;
                        const audioPart: Part = { inlineData: { data: audio, mimeType } };
                        stream = await ai.models.generateContentStream({
                            model,
                            contents: [{ role: "user", parts: [audioPart] }],
                        });
                        break;
                    }
                    default:
                        throw new Error(`Unsupported streaming task: ${task}`);
                }

                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
                controller.close();
            } catch (e) {
                controller.error(e);
            }
        },
    });

    return readableStream;
};

// ---------------------------------------------------------------------------
// Non-streaming helper – returns a plain JSON-serialisable object.
// ---------------------------------------------------------------------------

export const generateGeminiResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<any> => {
    const ai = getAI();

    switch (task) {
        case "groundedSearch":
        case "groundedMaps": {
            const { messages, model, systemInstruction, latLng } = payload;
            const contents = messages.map((msg: { role: string; text: string }) => ({
                role: msg.role,
                parts: [{ text: msg.text }],
            }));

            const tools: any[] =
                task === "groundedSearch" ? [{ googleSearch: {} }] : [{ googleMaps: {} }];
            const toolConfig =
                task === "groundedMaps" && latLng ? { retrievalConfig: { latLng } } : undefined;

            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction,
                    tools,
                    ...(toolConfig && { toolConfig }),
                },
            });

            return {
                text: response.text,
                sources:
                    response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
            };
        }
        case "tts": {
            const { text, model } = payload;
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: "Kore" },
                        },
                    },
                },
            });
            const audioContent =
                response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return { audioContent };
        }
        default:
            throw new Error(`Unsupported non-streaming task: ${task}`);
    }
};

// ---------------------------------------------------------------------------
// Specific helper for TTS
// ---------------------------------------------------------------------------

export const generateTextToSpeech = async (
    text: string,
): Promise<{ audioContent: string }> => {
    return generateGeminiResponse("tts", { text, model: MODELS.tts });
};
