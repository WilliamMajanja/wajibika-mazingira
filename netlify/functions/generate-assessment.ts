
import type { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

// Re-defining constants and types here to keep the function self-contained
// and avoid complex build-time pathing issues with Netlify Functions.
const GEMINI_MODEL = 'gemini-2.5-flash';

const ASSESSMENT_REPORT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    assessmentTitle: { type: Type.STRING, description: "The official title for the assessment report." },
    projectSummary: { type: Type.STRING, description: "A brief summary of the project being assessed." },
    legalFramework: {
      type: Type.ARRAY,
      description: "A list of relevant Kenyan laws, acts, and regulations.",
      items: {
        type: Type.OBJECT,
        properties: {
          statute: { type: Type.STRING, description: "The name of the law or regulation (e.g., 'EMCA, 1999')." },
          relevance: { type: Type.STRING, description: "How this law applies to the project." },
        },
        required: ["statute", "relevance"],
      },
    },
    potentialImpacts: {
      type: Type.ARRAY,
      description: "A list of potential environmental, social, or climate impacts.",
      items: {
        type: Type.OBJECT,
        properties: {
          impactArea: { type: Type.STRING, description: "The area of impact (e.g., 'Water Quality', 'Air Quality', 'Biodiversity')." },
          description: { type: Type.STRING, description: "A detailed description of the potential impact." },
          severity: { type: Type.STRING, description: "The severity of the impact (e.g., 'Low', 'Medium', 'High')." },
        },
        required: ["impactArea", "description", "severity"],
      },
    },
    mitigationMeasures: {
      type: Type.ARRAY,
      description: "A list of proposed measures to mitigate the negative impacts.",
      items: {
        type: Type.OBJECT,
        properties: {
          measure: { type: Type.STRING, description: "The specific mitigation measure." },
          implementation: { type: Type.STRING, description: "Details on how the measure will be implemented." },
        },
        required: ["measure", "implementation"],
      },
    },
    stakeholderEngagementPlan: { type: Type.STRING, description: "A comprehensive plan for engaging relevant stakeholders like NEMA, local communities, and county governments." },
    recommendations: { type: Type.STRING, description: "Final conclusions and recommendations for the project to proceed, be amended, or be rejected." },
  },
  required: ["assessmentTitle", "projectSummary", "legalFramework", "potentialImpacts", "mitigationMeasures", "stakeholderEngagementPlan", "recommendations"],
};

const generatePrompt = (
    assessmentType: string,
    projectName: string,
    projectLocation: string,
    projectDescription: string
): string => {
    return `
      Generate a comprehensive '${assessmentType}' for the following project based in Kenya.
      Project Details:
      - Name: ${projectName}
      - Location: ${projectLocation}
      - Description: ${projectDescription}
      Your response MUST strictly adhere to the provided JSON schema.
      The analysis must be grounded in Kenyan law, primarily the Environmental Management and Co-ordination Act (EMCA), and consider relevant bodies like NEMA.
    `;
};

const cleanJsonString = (rawText: string): string => {
    let jsonText = rawText.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return jsonText;
}

export const handler: Handler = async (event: HandlerEvent) => {
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

    const { assessmentType, projectName, projectLocation, projectDescription } = JSON.parse(event.body || '{}');

    if (!assessmentType || !projectName || !projectLocation || !projectDescription) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required project details.' }) };
    }

    const prompt = generatePrompt(assessmentType, projectName, projectLocation, projectDescription);

    const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: ASSESSMENT_REPORT_SCHEMA,
            systemInstruction: "You are an expert environmental legal consultant specializing in Kenyan law. Your primary role is to assist legal practitioners in drafting comprehensive environmental impact assessments. All your outputs must be based on current Kenyan legislation, including but not not limited to the Environmental Management and Co-ordination Act (EMCA), and relevant international conventions that Kenya is a signatory to. Provide structured, detailed, and actionable advice.",
        }
    });
    
    const rawText = result.text;
    const cleanText = cleanJsonString(rawText);

    try {
        // Validate the JSON structure on the server before sending to client.
        JSON.parse(cleanText);
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: cleanText,
        };
    } catch (parseError) {
        console.error("AI returned malformed JSON:", parseError);
        console.error("Malformed response text:", cleanText);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "The AI returned an invalid response format. Please try generating the report again." }),
        };
    }

  } catch (error: any) {
    console.error("Error in generateAssessment function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Failed to generate assessment report." }),
    };
  }
};
