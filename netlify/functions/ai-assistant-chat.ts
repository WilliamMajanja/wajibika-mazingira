
import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { stream } from '@netlify/functions';

const GEMINI_MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION = "You are an expert environmental legal consultant specializing in Kenyan law. Your primary role is to assist legal practitioners by answering their questions. All your outputs must be based on current Kenyan legislation, including but not limited to the Environmental Management and Co-ordination Act (EMCA), and relevant international conventions that Kenya is a signatory to. Provide structured, detailed, and actionable advice. Format your responses clearly using markdown for lists, bolding, and headings where appropriate.";

/**
 * Transforms a stream of Gemini API responses into a stream of text chunks.
 * @param geminiStream An async iterable of GenerateContentResponse objects.
 * @returns An async iterable of strings.
 */
async function* toTextStream(geminiStream: AsyncIterable<GenerateContentResponse>) {
  for await (const chunk of geminiStream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

export const handler: Handler = stream(async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      console.error("API_KEY is not configured.");
      return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "The application's AI service is not configured. Please contact the administrator." }),
      };
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const { history, message } = JSON.parse(event.body || '{}');
    
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
      history: history || [],
    });

    const geminiStream = await chat.sendMessageStream({ message });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
      body: toTextStream(geminiStream),
    };

  } catch (error: any) {
    console.error("Error in ai-assistant-chat function:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Failed to start chat." }),
    };
  }
});
