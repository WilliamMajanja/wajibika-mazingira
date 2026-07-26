import { getProvider } from '../contexts/aiProviderLib';
import type { AiMessage, AiStreamOptions } from './aiProvider';

export type ChatMode = 'fast' | 'smart' | 'grounded' | 'maps';

const MODE_STREAM_OPTIONS: Record<ChatMode, AiStreamOptions> = {
  fast: { numPredict: 128, temperature: 0.5 },
  smart: { numPredict: 256, temperature: 0.3 },
  grounded: { numPredict: 256, temperature: 0.3 },
  maps: { numPredict: 256, temperature: 0.3 },
};

export const streamAIResponse = async (
  task: string,
  payload: Record<string, unknown>,
): Promise<ReadableStream<Uint8Array>> => {
  const provider = getProvider();

  switch (task) {
    case 'chat':
    case 'complexGeneration': {
      const p = payload as { messages: AiMessage[]; model?: string; systemInstruction?: string; mode?: string };
      const options = p.mode ? MODE_STREAM_OPTIONS[p.mode as ChatMode] : undefined;
      return provider.streamChat(p.messages, p.systemInstruction, p.model, options);
    }
    case 'analyzeImage': {
      const p = payload as { prompt: string; image: string; mimeType: string; model?: string };
      return provider.streamImageAnalysis(p);
    }
    default:
      throw new Error(`Unsupported streaming task: ${task}`);
  }
};

export const generateAIResponse = async (
  task: string,
  payload: Record<string, unknown>,
): Promise<{ text: string; sources?: Record<string, unknown>[] }> => {
  const provider = getProvider();

  switch (task) {
    case 'chat': {
      const p = payload as { messages: AiMessage[]; model?: string; systemInstruction?: string };
      return provider.generateChat(p.messages, p.systemInstruction, p.model);
    }
    default:
      throw new Error(`Unsupported non-streaming task: ${task}`);
  }
};

export const speakText = (text: string): void => {
  if (!('speechSynthesis' in window)) {
    throw new Error('Text-to-speech is not supported in this browser.');
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};
