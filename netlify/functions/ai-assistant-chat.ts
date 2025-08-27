import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { stream } from '@netlify/functions';

const LEGAL_RESOURCES_CONTEXT = `
Here is a curated list of key Kenyan environmental bodies and legal resources. When a user's query touches upon the domain of one of these entities, you should mention it as a potential resource for more detailed information and provide its URL if available.

- **National Environment Management Authority (NEMA)**: The primary government body for environmental management and policy. Relevant for almost all environmental queries. (nema.go.ke)
- **Water Resources Authority (WRA)**: Regulates and manages water resources. (wra.go.ke)
- **Kenya Forest Service (KFS)**: Manages state and community forests. Relevant for deforestation, afforestation, and projects on forest land. (kenyaforestservice.org)
- **Kenya Wildlife Service (KWS)**: Manages wildlife and enforces related laws. (kws.go.ke)
- **Ministry of Environment, Climate Change and Forestry**: Oversees national environmental and forestry policy. (environment.go.ke)
- **Ministry of Mining and Blue Economy**: Manages mineral resources and blue economy sectors like fisheries. (mining.go.ke)
- **Kenya Law Repository**: The official source for all Kenyan laws, including the Environmental Management and Co-ordination Act (EMCA). (kenyalaw.org)
- **National Environmental Tribunal**: Hears appeals against NEMA's decisions. (net.go.ke)
- **Law Society of Kenya (LSK)**: The premier bar association, with committees and resources on environmental law. (lsk.or.ke)
- **Green Belt Movement**: An influential NGO focused on community-based environmental conservation. (greenbeltmovement.org)
`;


const GEMINI_MODEL = 'gemini-2.5-flash';
const SYSTEM_INSTRUCTION = `You are an expert environmental legal consultant specializing in Kenyan law. Your primary role is to assist legal practitioners by answering their questions. All your outputs must be based on current Kenyan legislation, including but not limited to the Environmental Management and Co-ordination Act (EMCA), and relevant international conventions that Kenya is a signatory to. Provide structured, detailed, and actionable advice. Format your responses clearly using markdown for lists, bolding, and headings where appropriate.
${LEGAL_RESOURCES_CONTEXT}
`;
const MAX_HISTORY_MESSAGES = 10; // Limit to the last 10 messages to manage token usage

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
    
    // Truncate history to keep the conversation context manageable
    const truncatedHistory = history.length > MAX_HISTORY_MESSAGES 
        ? history.slice(-MAX_HISTORY_MESSAGES) 
        : history;

    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
      history: truncatedHistory || [],
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