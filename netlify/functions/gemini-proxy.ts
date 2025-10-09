import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";
import type { Assessment } from "../../src/types";

const getPromptForAssessmentType = (
    projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): string => {
    const { projectName, projectProponent, location, projectType, description, assessmentType } = projectDetails;

    const commonProjectDetails = `
    ### Project Details:
    - **Project Name:** ${projectName}
    - **Project Proponent:** ${projectProponent}
    - **Location:** ${location}, Kenya
    - **Project Type:** ${projectType}
    - **Detailed Description:** ${description}
    `;

    let specializedPrompt = '';

    switch (assessmentType) {
        case 'Social':
            specializedPrompt = `
            Act as a sociologist and community development expert specializing in Kenyan contexts.
            Generate a preliminary Social Impact Assessment (SIA) report.
            The report should be comprehensive and structured with the following sections:
            1.  **Executive Summary:** A brief overview of the project and key social findings.
            2.  **Project Introduction:** Detailed description of the proposed project's social context.
            3.  **Social Baseline Conditions:** Describe the local communities, demographics, livelihoods, cultural heritage, and social infrastructure.
            4.  **Stakeholder Analysis:** Identify key stakeholders and their interests.
            5.  **Potential Positive Social Impacts:** Outline benefits like job creation, skill development, and community empowerment.
            6.  **Potential Negative Social Impacts:** Detail adverse effects like displacement, cultural heritage loss, social conflicts, and strain on services.
            7.  **Mitigation & Enhancement Measures:** Propose specific actions to minimize negative impacts and maximize positive ones.
            8.  **Social Management & Monitoring Plan:** Suggest a framework for managing social issues.
            9.  **Conclusion:** Summarize the project's social feasibility.
            `;
            break;
        case 'Health':
             specializedPrompt = `
            Act as a public health expert with knowledge of environmental health in Kenya.
            Generate a preliminary Health Impact Assessment (HIA) report.
            The report must include these sections:
            1.  **Executive Summary:** Overview of key health-related findings.
            2.  **Project Introduction:** Description of project activities relevant to public health.
            3.  **Community Health Baseline:** Current health status of the affected population, including prevalent diseases and access to healthcare.
            4.  **Potential Health Risks:** Analyze risks from air/water/soil pollution, noise, occupational hazards, and potential for disease vector changes.
            5.  **Potential Health Benefits:** Identify positive outcomes like improved access to healthcare, better sanitation, or economic-driven health improvements.
            6.  **Mitigation Measures:** Propose specific measures to prevent or reduce health risks.
            7.  **Health Management & Monitoring Plan:** Outline a plan to monitor health indicators.
            8.  **Conclusion:** Summarize the project's overall impact on public health.
            `;
            break;
        case 'Climate':
            specializedPrompt = `
            Act as a climate change risk analyst specializing in East Africa.
            Generate a preliminary Climate Impact Assessment (CIA) report.
            The report should cover:
            1.  **Executive Summary:** Key climate-related findings.
            2.  **Project Introduction:** How the project relates to climate change.
            3.  **Project's Carbon Footprint:** Estimate the greenhouse gas emissions during construction and operation.
            4.  **Climate Vulnerability Assessment:** How will climate change (e.g., increased flooding, drought) impact the project's viability?
            5.  **Impact on Local Climate Resilience:** How does the project affect the community's ability to adapt to climate change?
            6.  **Alignment with Climate Policy:** Assess conformity with Kenya's National Climate Change Action Plan.
            7.  **Mitigation & Adaptation Measures:** Propose measures to reduce emissions (mitigation) and cope with climate impacts (adaptation).
            8.  **Conclusion:** Overall summary of the project's climate resilience and impact.
            `;
            break;
        case 'Cumulative':
            specializedPrompt = `
            Act as a senior environmental planner specializing in cumulative effects analysis in Kenya.
            Generate a preliminary Cumulative Impact Assessment (CuIA) report.
            The report must assess the project's impact in combination with other past, present, and foreseeable future projects in the area. Structure it as follows:
            1.  **Executive Summary:** Summary of cumulative effects.
            2.  **Introduction & Scope:** Define the assessment's scope and boundaries.
            3.  **Identification of Valued Components (VCs):** Identify key environmental and social components that could be affected (e.g., a specific watershed, wildlife corridor).
            4.  **Analysis of Cumulative Effects:** Analyze the combined effects on each VC from this project and others.
            5.  **Contribution of the Project:** Detail this specific project's contribution to the overall cumulative effects.
            6.  **Mitigation & Regional Planning:** Propose mitigation measures and recommendations for regional management.
            7.  **Conclusion:** Summarize the significance of the cumulative impacts.
            `;
            break;
        case 'Environmental':
        default:
            specializedPrompt = `
            Act as an expert environmental impact assessment consultant specializing in Kenyan regulations and ecosystems.
            Generate a preliminary Environmental Impact Assessment (EIA) report.
            The report should be comprehensive and structured with the following sections:
            1.  **Executive Summary:** A brief overview of the project and key findings.
            2.  **Project Introduction:** Detailed description of the proposed project.
            3.  **Baseline Environmental Conditions:** Describe the current state of the environment (flora, fauna, water, soil, communities).
            4.  **Potential Positive Impacts:** Outline potential benefits (e.g., job creation, economic growth).
            5.  **Potential Negative Impacts:** Detail adverse effects (e.g., deforestation, pollution, soil erosion, wildlife displacement).
            6.  **Mitigation Measures:** Propose specific actions to minimize negative impacts, referencing Kenyan NEMA guidelines.
            7.  **Environmental Management Plan (EMP):** Suggest a framework for monitoring and management.
            8.  **Conclusion:** Summarize the project's overall environmental feasibility.
            `;
            break;
    }

    return `${specializedPrompt}\n${commonProjectDetails}\nThe tone should be formal, scientific, and objective. Format the output using Markdown for clear headings and lists. It is critical that you generate the entire report, covering all requested sections, before you conclude your response. At the very end of the report, add the marker "--- END OF REPORT ---".`;
};


export default async (req: Request, context: Context) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error('API_KEY is not configured on the server.');
      return new Response(JSON.stringify({ error: 'API_KEY is not configured on the server.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    const readableStream = new ReadableStream({
      async start(controller) {
          try {
              const { type } = body;

              if (type === 'assessment') {
                  const details = body.details as Omit<Assessment, 'id' | 'report' | 'createdAt'>;
                  if (!details || !details.projectName || !details.projectProponent || !details.location || !details.projectType || !details.description) {
                      throw new Error('Missing required assessment details.');
                  }
                  const prompt = getPromptForAssessmentType(details);
                  const responseStream = await ai.models.generateContentStream({
                      model: 'gemini-2.5-flash',
                      contents: prompt,
                      config: { temperature: 0.5, topP: 0.95 }
                  });

                   for await (const chunk of responseStream) {
                      const text = chunk.text;
                      if (text) {
                          controller.enqueue(new TextEncoder().encode(text));
                      }
                  }

              } else if (type === 'chat') {
                  const messages = body.messages as { role: 'user' | 'model', text: string }[];
                   if (!messages || !Array.isArray(messages) || messages.length === 0) {
                       throw new Error('Missing or empty messages array for chat.');
                  }
                  
                  // The last message is the new prompt
                  const lastUserMessage = messages[messages.length - 1];
                  if (lastUserMessage.role !== 'user') {
                      throw new Error('The last message in a chat history must be from the user.');
                  }
                  const currentMessage = lastUserMessage.text;

                  // The rest of the messages form the history
                  const history = messages.slice(0, messages.length - 1);
                  const contents: Content[] = history.map(msg => ({
                      role: msg.role,
                      parts: [{ text: msg.text }]
                  }));
                  
                  const chat = ai.chats.create({
                      model: 'gemini-2.5-flash',
                      history: contents,
                      config: {
                          systemInstruction: "You are a helpful assistant for community members in Kenya discussing environmental and social impacts of local projects. Your name is 'Mazingira Rafiki' (Environment Friend). Be polite, informative, and sensitive to local contexts. Encourage constructive dialogue.",
                      }
                  });

                  const responseStream = await chat.sendMessageStream({ message: currentMessage });

                  for await (const chunk of responseStream) {
                      const text = chunk.text;
                      if (text) {
                          controller.enqueue(new TextEncoder().encode(text));
                      }
                  }

              } else {
                   throw new Error('Invalid request type.');
              }
              controller.close();
          } catch (error) {
              console.error('Error during stream generation:', error);
              controller.error(error);
          }
      }
    });

    return new Response(readableStream, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
        },
    });
  } catch (error) {
      console.error('Critical error in Gemini proxy handler:', error);
      const message = error instanceof Error ? error.message : 'An internal server error occurred.';
      return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
      });
  }
};