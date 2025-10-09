import { GoogleGenAI, Content, Chat } from "@google/genai";
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
            6.  **Potential Negative Social Impacts:** Detail adverse effects like displacement, cultural heritage loss, or strain on social services.
            7.  **Mitigation Measures:** Propose specific, actionable strategies to minimize negative impacts.
            8.  **Conclusion and Recommendations:** Summarize the findings and provide clear recommendations for the project proponent.
            `;
            break;
        case 'Health':
            specializedPrompt = `
            Act as a public health official and epidemiologist.
            Generate a preliminary Health Impact Assessment (HIA) report.
            Structure the report with these sections:
            1.  **Executive Summary:** Key health-related findings and recommendations.
            2.  **Project Introduction:** Overview of the project from a public health perspective.
            3.  **Health Baseline Conditions:** Detail the current health status of the local population, including prevalent diseases, healthcare access, and environmental health factors (air/water quality).
            4.  **Potential Health Impacts (Positive and Negative):** Analyze impacts on disease transmission, occupational health and safety, access to healthcare, and mental well-being.
            5.  **Vulnerable Groups Analysis:** Identify groups disproportionately affected (e.g., children, elderly).
            6.  **Mitigation and Enhancement Measures:** Propose strategies to protect community health and enhance positive outcomes.
            7.  **Monitoring Plan:** Suggest a framework for monitoring health indicators.
            8.  **Conclusion and Recommendations:** Final summary and actionable public health recommendations.
            `;
            break;
        case 'Climate':
            specializedPrompt = `
            Act as a climate scientist and environmental planner.
            Generate a preliminary Climate Impact Assessment report.
            The report must include:
            1.  **Executive Summary:** Summary of climate-related risks and opportunities.
            2.  **Project Introduction:** Project description in the context of climate change.
            3.  **Climate Change Projections for the Region:** Use general knowledge of East African climate trends to describe anticipated changes in temperature, precipitation, and extreme weather events.
            4.  **Greenhouse Gas (GHG) Emissions Assessment:** Estimate the project's potential GHG emissions during construction and operation.
            5.  **Climate Vulnerability Assessment:** Analyze the project's vulnerability to climate change impacts (e.g., flooding, drought).
            6.  **Impact on Local Climate Resilience:** Assess how the project affects the community's ability to adapt to climate change.
            7.  **Mitigation and Adaptation Strategies:** Propose measures to reduce emissions and enhance resilience.
            8.  **Conclusion and Recommendations:** Summary of findings and climate-focused recommendations.
            `;
            break;
        case 'Cumulative':
            specializedPrompt = `
            Act as a senior environmental policy advisor with expertise in systems thinking.
            Generate a Cumulative Impact Assessment (CIA) report. This is the most complex assessment.
            The report must integrate findings across environmental, social, health, and climate domains to identify synergistic and cumulative effects.
            Structure the report as follows:
            1.  **Executive Summary:** A holistic overview of the combined, long-term impacts.
            2.  **Project Introduction:** Description of the project and its context within the existing landscape of other developments (even if hypothetical).
            3.  **Scoping and Spatial/Temporal Boundaries:** Define the geographical area and timeframe for the cumulative effects analysis.
            4.  **Analysis of Cumulative Effects:**
                *   **Environmental Stressors:** How do project impacts combine with existing environmental issues (e.g., deforestation, water pollution)?
                *   **Social Fabric:** How does the project interact with other social changes to affect community cohesion, inequality, and livelihoods?
                *   **Public Health System:** What is the combined strain on local health infrastructure from this and other activities?
                *   **Climate Resilience:** How does the project's climate footprint and vulnerability amplify or mitigate regional climate risks?
            5.  **Synergistic Impacts:** Identify "impact chains" where one type of impact triggers another (e.g., deforestation leading to soil erosion, affecting water quality and community health).
            6.  **Integrated Mitigation and Management Plan:** Propose a coordinated plan to manage these complex, interconnected impacts.
            7.  **Conclusion and Recommendations:** Provide strategic, high-level recommendations for sustainable development in the region.
            `;
            break;
        case 'Environmental':
        default:
            specializedPrompt = `
            Act as a senior Environmental Scientist registered with NEMA (National Environment Management Authority) in Kenya.
            Generate a professional, preliminary Environmental Impact Assessment (EIA) Scoping Report.
            The report must be comprehensive and well-structured, following Kenyan standards. Include the following sections:
            1.  **Executive Summary:** A concise summary of the key findings and recommendations.
            2.  **Project Introduction:** A detailed description of the project, its objectives, and scope.
            3.  **Environmental Baseline Conditions:** Describe the current state of the physical environment (air, water, soil, biodiversity) and the socio-economic landscape.
            4.  **Legislative and Regulatory Framework:** Mention relevant Kenyan environmental laws (e.g., EMCA, 1999) and NEMA regulations.
            5.  **Anticipated Environmental Impacts:** Identify and analyze potential positive and negative impacts on air quality, water resources, biodiversity, land use, and local communities.
            6.  **Proposed Mitigation Measures:** Suggest practical and specific measures to prevent, reduce, or offset negative impacts.
            7.  **Environmental and Social Management Plan (ESMP) Outline:** Propose a framework for monitoring and managing environmental impacts throughout the project lifecycle.
            8.  **Analysis of Project Alternatives:** Briefly discuss alternatives to the proposed project, including the "no-project" option.
            9.  **Conclusion and Recommendations:** A clear summary of the assessment's conclusions and recommendations for the next steps.
            `;
            break;
    }
    // Final instruction for the model
    return `${commonProjectDetails}\n\n${specializedPrompt}\n\nGenerate the report in well-formatted Markdown. At the very end of the entire response, include the text "--- END OF REPORT ---".`;
};

const streamResponse = async (stream: AsyncGenerator<any>, responseStream: ReadableStreamDefaultController) => {
    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            responseStream.enqueue(new TextEncoder().encode(chunkText));
        }
    }
};

export default async (req: Request, context: Context) => {
    const { API_KEY } = process.env;
    if (!API_KEY) {
        return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { type, details, messages } = await req.json();
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    if (type === 'assessment') {
                        const prompt = getPromptForAssessmentType(details);
                        const chat: Chat = ai.chats.create({ model: 'gemini-2.5-flash' });
                        const resultStream = await chat.sendMessageStream({ message: prompt });
                        await streamResponse(resultStream, controller);

                    } else if (type === 'chat') {
                        // Ensure history starts with a user message
                        const validHistory = messages.slice();
                        if (validHistory.length > 0 && validHistory[0].role !== 'user') {
                            validHistory.shift(); 
                        }
                        
                        // Map to the format expected by the GenAI SDK
                        const history: Content[] = validHistory.map((msg: {role: 'user' | 'model', text: string}) => ({
                            role: msg.role,
                            parts: [{ text: msg.text }]
                        }));

                        // The last message is the new prompt
                        const userMessage = history.pop();
                        if (!userMessage) {
                             throw new Error("No user message found to send.");
                        }

                        const chat: Chat = ai.chats.create({
                            model: 'gemini-2.5-flash',
                            config: {
                                systemInstruction: "You are 'Mazingira Rafiki', a helpful, anonymous AI assistant for a Kenyan community forum. Your goal is to facilitate constructive discussions about environmental and social impacts of local projects. Be neutral, informative, and encouraging. Do not provide legal advice. Keep responses concise and clear. All conversations are in English."
                            },
                            history: history,
                        });
                        
                        const resultStream = await chat.sendMessageStream({ message: userMessage.parts[0].text });
                        await streamResponse(resultStream, controller);

                    } else {
                        controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: "Invalid request type" })));
                    }
                } catch (e) {
                    const error = e as Error;
                    console.error("Gemini API Error:", error);
                    // Do not expose detailed internal errors to the client
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: "An error occurred while communicating with the AI." })));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(readableStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (e) {
        const error = e as Error;
        console.error("Proxy function error:", error);
        return new Response(JSON.stringify({ error: "Invalid request body or internal server error." }), { status: 400 });
    }
};
