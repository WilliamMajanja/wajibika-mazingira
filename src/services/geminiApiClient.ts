// src/services/geminiApiClient.ts
import { MODELS } from "../config/ai";

// Generic function for streaming responses from the Gemini proxy
export const streamGeminiResponse = async (task: string, payload: object): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stream: true,
            task,
            ...payload
        }),
    });
    
    if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.body;
}

// Generic function for non-streaming responses from the Gemini proxy
export const generateGeminiResponse = async (task: string, payload: object): Promise<any> => {
     const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stream: false,
            task,
            ...payload
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

// Specific helper for TTS
export const generateTextToSpeech = async (text: string): Promise<{ audioContent: string }> => {
    return generateGeminiResponse('tts', { text, model: MODELS.tts });
}
