// src/services/aiClient.ts
// Calls the Google Gemini API directly from the browser via the @google/genai SDK.
// The API key is read from the VITE_GEMINI_API_KEY environment variable at build time.

import { GoogleGenAI, type Content, type Part } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let _client: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
    if (!API_KEY) {
        throw new Error(
            "Gemini API key is not configured. Set the VITE_GEMINI_API_KEY environment variable."
        );
    }
    if (!_client) {
        _client = new GoogleGenAI({ apiKey: API_KEY });
    }
    return _client;
};

// ---------------------------------------------------------------------------
// Internal helper – converts the app's message format to Gemini Content[].
// ---------------------------------------------------------------------------

const buildContents = (
    messages: { role: string; text: string }[],
): Content[] => {
    return messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : msg.role,
        parts: [{ text: msg.text }],
    }));
};

// ---------------------------------------------------------------------------
// Streaming helper – returns a ReadableStream<Uint8Array> to keep the same
// interface that the rest of the app already consumes.
// ---------------------------------------------------------------------------

export const streamAIResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<ReadableStream<Uint8Array>> => {
    const client = getClient();
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                switch (task) {
                    case "chat":
                    case "complexGeneration": {
                        const { messages, model, systemInstruction } = payload;
                        const contents = buildContents(messages);

                        const stream = await client.models.generateContentStream({
                            model,
                            contents,
                            config: systemInstruction
                                ? { systemInstruction }
                                : undefined,
                        });

                        for await (const chunk of stream) {
                            const text = chunk.text;
                            if (text) {
                                controller.enqueue(encoder.encode(text));
                            }
                        }
                        controller.close();
                        break;
                    }
                    case "analyzeImage": {
                        const { prompt, image, mimeType, model } = payload;
                        const parts: Part[] = [
                            { text: prompt },
                            { inlineData: { data: image, mimeType } },
                        ];

                        const stream = await client.models.generateContentStream({
                            model,
                            contents: [{ role: "user", parts }],
                        });

                        for await (const chunk of stream) {
                            const text = chunk.text;
                            if (text) {
                                controller.enqueue(encoder.encode(text));
                            }
                        }
                        controller.close();
                        break;
                    }
                    default:
                        throw new Error(`Unsupported streaming task: ${task}`);
                }
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

export const generateAIResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<any> => {
    const client = getClient();

    switch (task) {
        case "groundedSearch":
        case "groundedMaps":
        case "chat": {
            const { messages, model, systemInstruction } = payload;
            const contents = buildContents(messages);

            const tools = (task === "groundedSearch" || task === "groundedMaps")
                ? [{ googleSearch: {} }]
                : undefined;

            const result = await client.models.generateContent({
                model,
                contents,
                config: {
                    ...(systemInstruction ? { systemInstruction } : {}),
                    ...(tools ? { tools } : {}),
                },
            });

            const text = result.text ?? "";
            const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
            const sources = groundingMetadata?.groundingChunks ?? [];

            return { text, sources };
        }
        default:
            throw new Error(`Unsupported non-streaming task: ${task}`);
    }
};

// ---------------------------------------------------------------------------
// Text-to-Speech – uses the browser SpeechSynthesis API.
// ---------------------------------------------------------------------------

export const speakText = (text: string): void => {
    if (!("speechSynthesis" in window)) {
        throw new Error("Text-to-speech is not supported in this browser.");
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
};
