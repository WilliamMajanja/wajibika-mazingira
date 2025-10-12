// src/services/geminiApiClient.ts

// A client for interacting with our Netlify gemini-proxy serverless function.
// This centralizes API calls, streaming logic, and error handling.

interface StreamChatResponseParams {
    messages: { role: 'user' | 'model'; text: string }[];
    systemInstruction?: string;
}

export const streamChatResponse = async ({ messages, systemInstruction }: StreamChatResponseParams): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'chat', // The only type our proxy supports now
            messages,
            systemInstruction, // If undefined, the proxy will use its default instruction
        }),
    });
    
    if (!response.ok || !response.body) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
            // Try to parse a JSON error from the proxy
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch {
            // Fallback to text if JSON parsing fails
            const textError = await response.text();
            errorMessage = textError || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.body;
}
