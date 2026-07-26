export type AiProviderType = 'ollama' | 'openrouter' | 'qvac' | 'local';

export interface AiProviderConfig {
  type: AiProviderType;
  ollamaUrl?: string;
  ollamaModel?: string;
  openRouterKey?: string;
  openRouterModel?: string;
  qvacUrl?: string;
  qvacModel?: string;
  qvacApiKey?: string;
}

export interface AiMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  text: string;
}

export interface AiImagePart {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface AiTextPart {
  type: 'text';
  text: string;
}

export type AiPart = AiTextPart | AiImagePart;

export interface AiImagePayload {
  prompt: string;
  image: string;
  mimeType: string;
  model?: string;
}

export interface AiStreamOptions {
  numPredict?: number;
  temperature?: number;
  /** Timeout in ms for the initial HTTP fetch. Stream-level timeouts are handled by useStreamReader. */
  fetchTimeout?: number;
}

export interface AiProvider {
  streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>>;

  streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>>;

  generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: Record<string, unknown>[] }>;
}

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.1:latest';
const DEFAULT_TIMEOUT = 30000; // 30 seconds for non-streaming
const STREAM_FETCH_TIMEOUT = 300000; // 5 minutes for streaming initial fetch
const MAX_RETRIES = 3;
const STREAM_MAX_RETRIES = 1; // streaming should not retry (stream already partially consumed)
const BASE_RETRY_DELAY = 1000; // 1 second

// --- Utility: Retry with exponential backoff ---
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) return res;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }

      // For server errors (5xx) and rate limits (429), retry
      lastError = new Error(`HTTP ${res.status}`);
      if (attempt < retries) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeout}ms`);
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
      if (attempt < retries) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

export class OllamaProvider implements AiProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AiProviderConfig) {
    this.baseUrl = (config.ollamaUrl || DEFAULT_OLLAMA_URL).replace(/\/+$/, '');
    this.model = config.ollamaModel || DEFAULT_OLLAMA_MODEL;
  }

  private async createStream(
    body: Record<string, unknown>,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetchWithRetry(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, stream: true, options: { num_predict: options?.numPredict ?? 256, temperature: options?.temperature ?? 0.3 } }),
    }, STREAM_MAX_RETRIES, options?.fetchTimeout ?? STREAM_FETCH_TIMEOUT);

    if (!res.ok) {
      throw new Error(`Ollama service error (${res.status}). Please check if Ollama is running.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Ollama returned no response body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                if (json.done) { controller.close(); return; }
                if (json.message?.content) {
                  controller.enqueue(encoder.encode(json.message.content));
                }
              } catch { /* skip malformed */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const ollamaMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      ollamaMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      ollamaMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }
    return this.createStream({
      model: model || this.model,
      messages: ollamaMessages,
    }, options);
  }

  async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetchWithRetry(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: payload.model || this.model,
        prompt: payload.prompt,
        images: [payload.image],
        stream: true,
      }),
    }, STREAM_MAX_RETRIES, STREAM_FETCH_TIMEOUT);

    if (!res.ok) {
      throw new Error(`Ollama vision service error (${res.status}). Please check if Ollama is running.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Ollama returned no response body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const cleanContent = this.cleanContent.bind(this);

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const json = JSON.parse(line);
                if (json.done) { controller.close(); return; }
                if (json.response) {
                  const cleaned = cleanContent(json.response);
                  if (cleaned) {
                    controller.enqueue(encoder.encode(cleaned));
                  }
                }
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: Record<string, unknown>[] }> {
    const ollamaMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      ollamaMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      ollamaMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await fetchWithRetry(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || this.model, messages: ollamaMessages, stream: false }),
    }, MAX_RETRIES, 60000);

    if (!res.ok) {
      throw new Error(`Ollama service error (${res.status}). Please check if Ollama is running.`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.message?.content || '');
    return { text: cleanedText };
  }

  private cleanContent(content: string): string {
    if (!content || typeof content !== 'string') return '';
    let cleaned = content.trim();
    const commonCorrections: Record<string, string> = {
      'wierd': 'weird',
      'seperate': 'separate',
      'recieve': 'receive',
      'definately': 'definitely',
      'occured': 'occurred',
    };
    for (const [incorrect, correct] of Object.entries(commonCorrections)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      cleaned = cleaned.replace(regex, correct);
    }
    return cleaned;
  }
}

const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash-free';

export class OpenRouterProvider implements AiProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AiProviderConfig) {
    this.apiKey = config.openRouterKey || '';
    this.model = config.openRouterModel || DEFAULT_OPENROUTER_MODEL;
  }

  private async openRouterFetch(
    body: Record<string, unknown>,
    timeout: number = DEFAULT_TIMEOUT,
    retries: number = MAX_RETRIES,
  ): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required. Please configure it in AI Settings.');
    }
    return fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Wajibika Mazingira',
      },
      body: JSON.stringify(body),
    }, retries, timeout);
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const orMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      orMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      orMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.openRouterFetch({
      model: model || this.model,
      messages: orMessages,
      stream: true,
    }, options?.fetchTimeout ?? STREAM_FETCH_TIMEOUT, STREAM_MAX_RETRIES);

    if (!res.ok) {
      throw new Error(`OpenRouter service error (${res.status}). Please check your API key and try again.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('OpenRouter returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const content: ({ type: string; text: string } | { type: string; image_url: { url: string } })[] = [{ type: 'text', text: payload.prompt }];
    content.push({
      type: 'image_url',
      image_url: { url: `data:${payload.mimeType};base64,${payload.image}` },
    });

    const res = await this.openRouterFetch({
      model: payload.model || this.model,
      messages: [{ role: 'user', content }],
      stream: true,
    }, STREAM_FETCH_TIMEOUT, STREAM_MAX_RETRIES);

    if (!res.ok) {
      throw new Error(`OpenRouter vision service error (${res.status}). Please check your API key and try again.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('OpenRouter returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: Record<string, unknown>[] }> {
    const orMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      orMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      orMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.openRouterFetch({
      model: model || this.model,
      messages: orMessages,
      stream: false,
    }, 60000);

    if (!res.ok) {
      throw new Error(`OpenRouter service error (${res.status}). Please check your API key and try again.`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.choices?.[0]?.message?.content || '');
    return { text: cleanedText };
  }
}

function cleanContent(content: string): string {
  if (!content || typeof content !== 'string') return '';
  let cleaned = content.trim();
  const commonCorrections: Record<string, string> = {
    'wierd': 'weird',
    'seperate': 'separate',
    'recieve': 'receive',
    'definately': 'definitely',
    'occured': 'occurred',
  };
  for (const [incorrect, correct] of Object.entries(commonCorrections)) {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correct);
  }
  return cleaned;
}

const DEFAULT_QVAC_URL = 'http://localhost:11434';
const DEFAULT_QVAC_MODEL = 'phi3:mini';

export class QvacProvider implements AiProvider {
  private baseUrl: string;
  private model: string;
  private apiKey?: string;

  constructor(config: AiProviderConfig) {
    this.baseUrl = (config.qvacUrl || DEFAULT_QVAC_URL).replace(/\/+$/, '');
    this.model = config.qvacModel || DEFAULT_QVAC_MODEL;
    this.apiKey = config.qvacApiKey || undefined;
  }

  private async qvacFetch(
    body: Record<string, unknown>,
    timeout: number = DEFAULT_TIMEOUT,
    retries: number = MAX_RETRIES,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return fetchWithRetry(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }, retries, timeout).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`QVAC connection timed out. Please ensure QVAC is running locally on ${this.baseUrl}.`);
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`QVAC connection failed. Please ensure QVAC is running locally on ${this.baseUrl}.`);
      }
      throw error;
    });
  }

  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
    options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const qvacMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      qvacMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      qvacMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.qvacFetch({
      model: model || this.model,
      messages: qvacMessages,
      stream: true,
    }, options?.fetchTimeout ?? STREAM_FETCH_TIMEOUT, STREAM_MAX_RETRIES);

    if (!res.ok) {
      throw new Error(`QVAC service error (${res.status}). Please check your configuration.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('QVAC returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async streamImageAnalysis(
    payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const content: ({ type: string; text: string } | { type: string; image_url: { url: string } })[] = [{ type: 'text', text: payload.prompt }];
    content.push({
      type: 'image_url',
      image_url: { url: `data:${payload.mimeType};base64,${payload.image}` },
    });

    const res = await this.qvacFetch({
      model: payload.model || this.model,
      messages: [{ role: 'user', content }],
      stream: true,
    }, STREAM_FETCH_TIMEOUT, STREAM_MAX_RETRIES);

    if (!res.ok) {
      throw new Error(`QVAC vision service error (${res.status}). Please check your configuration.`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('QVAC returned no body');

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6).trim();
              if (data === '[DONE]') { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              } catch { /* skip */ }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    model?: string,
  ): Promise<{ text: string; sources?: Record<string, unknown>[] }> {
    const qvacMessages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      qvacMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      qvacMessages.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.text });
    }

    const res = await this.qvacFetch({
      model: model || this.model,
      messages: qvacMessages,
      stream: false,
    }, 60000);

    if (!res.ok) {
      throw new Error(`QVAC service error (${res.status}). Please check your configuration.`);
    }

    const json = await res.json();
    const cleanedText = cleanContent(json.choices?.[0]?.message?.content || '');
    return { text: cleanedText };
  }
}

// --- Local Fallback Provider (offline-ready, no AI service required) ---

function extractProjectDetails(userText: string): { name: string; location: string; type: string } {
  const nameMatch = userText.match(/\*\*Project Name\*\*:\s*(.+)/i);
  const locMatch = userText.match(/\*\*Location\*\*:\s*(.+)/i);
  const typeMatch = userText.match(/\*\*Project Type\*\*:\s*(.+)/i);
  return {
    name: nameMatch ? nameMatch[1].trim() : 'the proposed project',
    location: locMatch ? locMatch[1].trim() : 'the project area',
    type: typeMatch ? typeMatch[1].trim() : 'conservation',
  };
}

const SECTION_RESPONSES: Record<string, string> = {
  '1.0 introduction': `### 1.0 Introduction

This Environmental Impact Assessment has been prepared to evaluate the potential environmental, social, and economic implications of the proposed project. The assessment follows the guidelines set forth by the Department of Environment (DoE) in Zanzibar and adheres to international best practices for environmental conservation and carbon sequestration projects.

**Purpose and Scope**: This assessment aims to identify potential environmental impacts, propose mitigation measures, and evaluate the project's contribution to carbon sequestration and community conservation goals. The assessment covers all phases of the project lifecycle, including planning, construction, operation, and decommissioning.

**Methodology**: The assessment employs a combination of field surveys, stakeholder consultations, spatial analysis using GIS, and application of established carbon accounting methodologies. Data sources include primary field data, secondary literature review, and community knowledge.

**Regulatory Framework**: The assessment is conducted in line with the Environmental Management for Sustainable Development Act (EMSA), Zanzibar's Nationally Determined Contributions (NDCs), and relevant international conventions including the Paris Agreement and Convention on Biological Diversity.`,

  '2.0 project description': `### 2.0 Project Description

The proposed project involves conservation and restoration activities designed to enhance carbon sequestration, biodiversity conservation, and community livelihoods.

**Project Objectives**:
- Restore and protect natural ecosystems and biodiversity corridors
- Sequester atmospheric carbon through reforestation and improved land management
- Generate high-quality carbon credits for the voluntary carbon market
- Enhance community livelihoods through sustainable resource use
- Build climate resilience in local communities

**Key Activities**:
- Native tree species planting and natural regeneration
- Sustainable land management practices
- Community-based natural resource management
- Establishment of monitoring plots and carbon accounting systems
- Development of alternative livelihood programs

**Project Timeline**: The project is designed for a 30-year crediting period with potential for renewal, consistent with standards such as Plan Vivo and VCS.`,

  '3.0 baseline conditions': `### 3.0 Baseline Conditions

The existing environmental and social conditions in the project area provide the baseline against which project impacts will be measured.

**Physical Environment**: The project area features diverse topography with varying soil types. The region experiences a bimodal rainfall pattern typical of East Africa. Local hydrology includes seasonal streams and groundwater resources that support both natural ecosystems and community livelihoods.

**Biological Environment**: The area supports a mix of indigenous vegetation types including woodlands, grasslands, and riparian forests. Wildlife present includes both resident and migratory species. Biodiversity surveys indicate presence of several species of conservation concern. The ecosystem provides critical habitat connectivity and ecosystem services.

**Socio-economic Context**: Local communities depend on natural resources for their livelihoods, including agriculture, livestock keeping, and non-timber forest products. Land use patterns include smallholder farming, communal grazing areas, and conservation areas. Population density and demographic trends influence resource use patterns.

**Carbon Baseline**: Current carbon stocks were assessed using field measurements and allometric equations. The baseline scenario projects continued land use change and associated emissions, establishing the additionality case for the project.`,

  '4.0 impact assessment': `### 4.0 Impact Assessment and Analysis

A comprehensive analysis of potential environmental and social impacts has been conducted, considering both positive and negative effects.

**Positive Impacts**:
- **Carbon Sequestration**: The project will enhance carbon storage in above-ground biomass, below-ground biomass, and soil organic carbon. Estimated sequestration potential ranges from 8-15 tCO₂e/ha/year depending on project activities and site conditions.
- **Biodiversity Conservation**: Habitat restoration will support native flora and fauna, improve ecosystem connectivity, and enhance ecosystem resilience to climate change.
- **Community Benefits**: Employment opportunities, capacity building, and alternative livelihood options will improve community well-being.
- **Ecosystem Services**: Improved water regulation, soil conservation, and microclimate regulation provide additional co-benefits.

**Negative Impacts**:
- **Land Use Change**: Temporary displacement of existing land uses during establishment phase requires careful management and community engagement.
- **Water Resources**: Increased water demand during seedling establishment may affect local water availability; mitigation through rainwater harvesting and efficient irrigation.
- **Construction Phase**: Short-term impacts from noise, dust, and waste generation during infrastructure development.

**Cumulative Impacts**: When considered alongside other conservation initiatives in the region, the project contributes positively to landscape-level conservation goals and regional climate change mitigation targets.`,

  '5.0 mitigation measures': `### 5.0 Mitigation Measures

The following mitigation measures are proposed to address identified negative impacts and enhance positive outcomes.

**Environmental Mitigation**:
- Establish buffer zones around water bodies and sensitive habitats
- Implement soil conservation measures including terracing and contour planting
- Develop a waste management plan for all project phases
- Use indigenous species for restoration to maintain genetic integrity
- Conduct regular environmental monitoring and adaptive management

**Social Mitigation**:
- Develop and implement a Community Engagement Plan
- Establish grievance redress mechanisms accessible to all community members
- Ensure free, prior, and informed consent (FPIC) for all project activities
- Provide fair compensation for any land use changes affecting community resources
- Prioritize local employment and capacity building

**Climate Risk Mitigation**:
- Select climate-resilient species for restoration activities
- Design fire breaks and develop fire management plans
- Implement drought contingency measures
- Diversify livelihood options to reduce climate vulnerability

**Monitoring and Compliance**: A Monitoring, Reporting, and Verification (MRV) framework will be implemented to track mitigation effectiveness and ensure compliance with regulatory requirements and carbon standards.`,

  '6.0 carbon sequestration': `### 6.0 Carbon Sequestration Potential

The carbon sequestration potential of the project has been evaluated using established methodologies and conservative assumptions.

**Carbon Stock Assessment**:
- **Above-ground Biomass**: Initial carbon stocks estimated at 40-60 tC/ha, with potential to increase to 120-180 tC/ha at maturity
- **Below-ground Biomass**: Root biomass contributes an additional 20-30% of above-ground carbon stocks
- **Soil Organic Carbon**: Significant soil carbon sequestration potential, particularly under improved land management practices
- **Litter and Dead Wood**: Contribute to total ecosystem carbon storage

**Sequestration Rates**:
- **Annual Sequestration Rate**: 8-15 tCO₂e/ha/year
- **10-Year Potential**: 80-150 tCO₂e/ha
- **30-Year Potential**: 240-450 tCO₂e/ha

**Methodology**:
The project will apply the following carbon accounting methodologies:
1. **Plan Vivo** - Best suited for community-based projects with strong co-benefits
2. **VCS VM0017** - For improved land management and restoration
3. **Gold Standard Afforestation/Reforestation Methodology**

**Leakage and Permanence**:
- **Leakage Risk**: Low with proper community engagement and alternative livelihood programs
- **Permanence Risk**: Medium; addressed through long-term management agreements, buffer pools, and insurance mechanisms

**Co-benefits**: Beyond carbon, the project delivers biodiversity conservation, watershed protection, livelihood improvement, and climate adaptation benefits aligned with multiple SDGs.`,

  '7.0 community conservation': `### 7.0 Community Conservation Impact

Community engagement and participation are central to the project's success and long-term sustainability.

**Community Engagement Framework**:
- Participatory planning and decision-making processes
- Benefit-sharing mechanisms ensuring equitable distribution of project revenues
- Community-based monitoring programs building local capacity
- Traditional knowledge integration with scientific approaches

**Livelihood Impacts**:
- Direct employment: 50-200 jobs during implementation and monitoring phases
- Alternative livelihood programs: beekeeping, ecotourism, sustainable agriculture
- Capacity building: training in environmental monitoring, carbon accounting, and business skills
- Revenue sharing: 20-30% of carbon credit revenues directed to community development projects

**Social Safeguards**:
- Free, Prior, and Informed Consent (FPIC) process
- Grievance redress mechanism
- Protection of vulnerable groups and indigenous rights
- Gender mainstreaming and youth engagement

**Community Governance**: The project establishes community governance structures including a Project Management Committee with community representation, ensuring local ownership and accountability.`,

  '8.0 conclusion': `### 8.0 Conclusion and Recommendations

**Conclusion**: The proposed conservation project demonstrates strong potential for positive environmental and social impacts while generating verifiable carbon credits. The assessment confirms that with appropriate mitigation measures and community engagement, the project can deliver significant carbon sequestration benefits, biodiversity conservation, and community development outcomes.

**Recommendations**:

1. **Proceed with Implementation**: Subject to regulatory approvals and community consent, the project should proceed with implementation following a phased approach.

2. **Strengthen MRV Framework**: Establish robust monitoring, reporting, and verification systems from project inception, including baseline documentation, annual monitoring, and third-party verification every 5 years.

3. **Enhance Community Engagement**: Continue and deepen community participation in all project phases, ensuring benefit-sharing mechanisms are transparent and equitable.

4. **Pursue Certification**: Seek certification under Plan Vivo or VCS to access premium carbon markets and ensure credibility of carbon credits.

5. **Adaptive Management**: Implement adaptive management approaches to respond to monitoring findings, changing conditions, and stakeholder feedback.

6. **Climate Resilience**: Integrate climate adaptation measures into project design to ensure long-term sustainability of project outcomes.

7. **Knowledge Sharing**: Document lessons learned and share with other conservation initiatives to amplify impact and contribute to best practices in the sector.`,
};

function generateLocalResponse(messages: AiMessage[], systemInstruction?: string): string {
  const userText = messages.map(m => m.text).join('\n');
  const userTextLower = userText.toLowerCase();
  const sysText = (systemInstruction || '').toLowerCase();

  // 1. Section-aware assessment generation
  if (sysText.includes('doe') || sysText.includes('department of environment') || sysText.includes('nema') || (sysText.includes('assessment') && (sysText.includes('environmental') || sysText.includes('carbon')))) {
    for (const [sectionKey, response] of Object.entries(SECTION_RESPONSES)) {
      if (userTextLower.includes(sectionKey)) {
        const details = extractProjectDetails(userText);
        return response.replace(/the proposed project/g, details.name)
                        .replace(/the project area/g, details.location)
                        .replace(/conservation/g, details.type);
      }
    }
    // If no specific section matched, return introduction
    const details = extractProjectDetails(userText);
    return SECTION_RESPONSES['1.0 introduction']
      .replace(/the proposed project/g, details.name)
      .replace(/the project area/g, details.location)
      .replace(/conservation/g, details.type);
  }

  // 2. Image analysis (check user text first, as image analysis calls this path too)
  if (userTextLower.includes('image') || userTextLower.includes('photo') || userTextLower.includes('picture') || userTextLower.includes('analyze this image')) {
    return 'This image shows environmental monitoring data from the project site. The area appears to be a conservation area with native vegetation cover, natural water resources, and biodiversity indicators consistent with Zanzibar\u2019s coastal and forest ecosystems. Key observations include healthy vegetation patterns, evidence of wildlife activity, and intact riparian zones. Further field verification is recommended to confirm these satellite and photographic observations.';
  }

  // 3. Market analysis (check user text before system instruction to differentiate from carbon analysis)
  if (userTextLower.includes('market') || userTextLower.includes('credit market') || userTextLower.includes('order book') || userTextLower.includes('buy orders') || userTextLower.includes('sell orders') || userTextLower.includes('market trend analysis')) {
    return `## Market Intelligence Report

### Market Overview
The carbon credit market shows active trading with balanced supply and demand dynamics. Current market conditions favor both buyers and sellers with competitive pricing across multiple project types.

### Trend Analysis
- **Short-term (24h)**: Prices are stable with moderate trading volume of 500-1,000 tCO₂.
- **Medium-term (1 week)**: Expect consolidation as market digests recent project registrations and new credit issuances.
- **Long-term (1 month)**: Upward trend likely as new compliance deadlines approach and corporate buyers increase procurement.

### Strategy Recommendations
- **Buyers**: Consider placing limit orders at 5-10% below current market for best execution. Premium credits with SDG co-benefits command higher prices.
- **Sellers**: Premium pricing available for verified credits with multiple SDG co-benefits. Conservation and agroforestry credits attract highest premiums.
- **Holders**: Current market conditions favor holding high-quality credits, particularly those with vintage 2024+ and third-party verification.

### Supply/Demand Observations
Demand is driven by corporate net-zero commitments (particularly in Europe and North America), while supply is constrained by verification timelines and project registration bottlenecks. This supply-demand imbalance supports continued price stability. Reforestation and conservation projects show strongest demand premium.

### Fair Value Estimates by Type
- **Reforestation/Afforestation**: $10-18/tCO₂
- **Conservation**: $8-15/tCO₂
- **Agroforestry**: $12-20/tCO₂
- **Soil Carbon**: $15-25/tCO₂
- **Blue Carbon**: $18-30/tCO₂
- **Renewable Energy**: $5-10/tCO₂`;
  }

  // 4. Carbon analysis
  if (sysText.includes('climate finance') || (sysText.includes('carbon') && userTextLower.includes('sequestration'))) {
    return `## Carbon Analysis Report

### Project Details
This analysis evaluates the carbon sequestration potential and climate impact of the proposed conservation project.

### Carbon Sequestration Estimates
- **Annual Rate**: 8-12 tCO₂e/ha/year (depending on project type and location)
- **10-Year Potential**: 80-120 tCO₂e/ha
- **30-Year Potential**: 240-360 tCO₂e/ha

### Recommended Standards
1. **Plan Vivo** - Best for community-based projects with co-benefits
2. **VCS (Verified Carbon Standard)** - Widely recognized for large-scale projects
3. **Gold Standard** - Emphasizes SDG contributions

### Risk Assessment
- **Leakage**: Low risk with proper community engagement and alternative livelihood programs
- **Permanence**: Medium risk; requires long-term monitoring agreements and buffer pools
- **Additionality**: Strong case if project exceeds business-as-usual and addresses financial or technical barriers

### MRV Recommendations
- Annual biomass inventory plots with permanent sampling points
- Remote sensing verification using satellite imagery (NDVI, LAI)
- Community-based monitoring participation for cost-effective data collection
- Third-party verification every 5 years by accredited verification body

### Estimated Credit Value
At current market prices ($8-15/tCO₂), this 100-hectare project could generate $8,000-18,000 annually in carbon revenue while delivering biodiversity and community co-benefits.`;

  }

  // 5. Governance / DAO proposal analysis
  if (sysText.includes('dao') || sysText.includes('governance') || sysText.includes('proposal') || (userTextLower.includes('proposal') && userTextLower.includes('analyze this governance'))) {
    return `## Governance Proposal Analysis

### Impact Summary
This proposal has the following implications for carbon conservation and community governance within the Wajibika Mazingira DAO framework.

### Arguments FOR
1. **Environmental Benefit**: Directly contributes to conservation outcomes and carbon sequestration goals.
2. **Community Empowerment**: Strengthens local decision-making and ownership of natural resources.
3. **Transparency**: On-chain voting ensures accountability and verifiable outcomes.
4. **Alignment**: Supports Zanzibar's vision for community-led natural resource management.

### Arguments AGAINST
1. **Implementation Complexity**: May require additional technical capacity for monitoring and compliance.
2. **Timeline Concerns**: Some measures may take longer to show measurable results than the voting period allows.
3. **Resource Requirements**: May need additional funding for full implementation and community outreach.

### Sentiment Analysis
Current voter sentiment suggests balanced consideration of environmental and community factors. Participation rates indicate active community engagement in governance processes.

### Recommendation
Proceed with implementation while establishing clear monitoring frameworks and community feedback mechanisms. Consider a phased approach to manage complexity and build local capacity. Regular progress reports should be submitted to the DAO for continued community oversight.`;

  }

  return `I understand your question about environmental conservation in Zanzibar. The Wajibika Mazingira platform supports community-led conservation, carbon credit trading, and environmental impact assessment. 

**Key Points**:
1. Community engagement is essential for successful conservation outcomes
2. Carbon credits provide sustainable funding for conservation projects
3. Regular monitoring and verification ensure environmental integrity
4. Local knowledge complements scientific approaches
5. The platform supports multiple assessment types (Environmental, Social, Health, Climate, Carbon Sequestration, Cumulative)

Feel free to ask for more specific information about impact assessments, carbon projects, market analysis, governance proposals, or community conservation initiatives.`;
}

function generateLocalStream(response: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  const words = response.split(' ');
  for (const word of words) {
    chunks.push(word + ' ');
  }
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      controller.close();
    },
  });
}

export class LocalFallbackProvider implements AiProvider {
  async streamChat(
    messages: AiMessage[],
    systemInstruction?: string,
    _model?: string,
    _options?: AiStreamOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const response = generateLocalResponse(messages, systemInstruction);
    return generateLocalStream(response);
  }

  async streamImageAnalysis(
    _payload: AiImagePayload,
  ): Promise<ReadableStream<Uint8Array>> {
    const response = 'Environmental image analysis: This image shows vegetation cover and land use patterns consistent with conservation activities in Zanzibar.';
    return generateLocalStream(response);
  }

  async generateChat(
    messages: AiMessage[],
    systemInstruction?: string,
    _model?: string,
  ): Promise<{ text: string; sources?: Record<string, unknown>[] }> {
    const response = generateLocalResponse(messages, systemInstruction);
    return { text: response };
  }
}

export function createProvider(config: AiProviderConfig): AiProvider {
  switch (config.type) {
    case 'ollama':
      return new OllamaProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'qvac':
      return new QvacProvider(config);
    case 'local':
      return new LocalFallbackProvider();
    default:
      console.warn(`[AI] Unknown provider type "${config.type}", falling back to LocalFallback`);
      return new LocalFallbackProvider();
  }
}
