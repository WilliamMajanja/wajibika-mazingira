// src/services/aiClient.ts
// Calls the GitHub Models API (OpenAI-compatible) directly from the browser.
// The token is read from the VITE_GITHUB_TOKEN environment variable at build time.

const API_BASE = "https://models.inference.ai.github.com";
const API_KEY = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

const getApiKey = (): string => {
    if (!API_KEY) {
        throw new Error(
            "GitHub token is not configured. Set the VITE_GITHUB_TOKEN environment variable."
        );
    }
    return API_KEY;
};

// ---------------------------------------------------------------------------
// Internal helper – builds an OpenAI-compatible request body.
// ---------------------------------------------------------------------------

interface ChatMessage {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

const buildMessages = (
    systemInstruction: string | undefined,
    messages: { role: string; text: string }[],
): ChatMessage[] => {
    const out: ChatMessage[] = [];
    if (systemInstruction) {
        out.push({ role: "system", content: systemInstruction });
    }
    for (const msg of messages) {
        out.push({ role: msg.role === "model" ? "assistant" : msg.role, content: msg.text });
    }
    return out;
};

// ---------------------------------------------------------------------------
// Streaming helper – returns a ReadableStream<Uint8Array> to keep the same
// interface that the rest of the app already consumes.
// ---------------------------------------------------------------------------

export const streamAIResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<ReadableStream<Uint8Array>> => {
    const apiKey = getApiKey();
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream<Uint8Array>({
        async start(controller) {
            try {
                let body: Record<string, any>;

                switch (task) {
                    case "chat":
                    case "complexGeneration": {
                        const { messages, model, systemInstruction } = payload;
                        body = {
                            model,
                            messages: buildMessages(systemInstruction, messages),
                            stream: true,
                        };
                        break;
                    }
                    case "analyzeImage": {
                        const { prompt, image, mimeType, model } = payload;
                        const dataUri = `data:${mimeType};base64,${image}`;
                        body = {
                            model,
                            messages: [
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: prompt },
                                        { type: "image_url", image_url: { url: dataUri } },
                                    ],
                                },
                            ],
                            stream: true,
                        };
                        break;
                    }
                    default:
                        throw new Error(`Unsupported streaming task: ${task}`);
                }

                const response = await fetch(`${API_BASE}/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`GitHub Models API error (${response.status}): ${errorText}`);
                }

                const reader = response.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    // Keep the last (potentially incomplete) line in the buffer
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith("data: ")) continue;
                        const data = trimmed.slice(6);
                        if (data === "[DONE]") continue;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                controller.enqueue(encoder.encode(content));
                            }
                        } catch {
                            // skip malformed chunks
                        }
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

export const generateAIResponse = async (
    task: string,
    payload: Record<string, any>,
): Promise<any> => {
    const apiKey = getApiKey();

    switch (task) {
        case "groundedSearch":
        case "groundedMaps":
        case "chat": {
            const { messages, model, systemInstruction } = payload;
            const body = {
                model,
                messages: buildMessages(systemInstruction, messages),
            };

            const response = await fetch(`${API_BASE}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GitHub Models API error (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            return {
                text: result.choices?.[0]?.message?.content ?? "",
                // GitHub Models does not provide grounding sources;
                // return an empty array for API compatibility.
                sources: [],
            };
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
