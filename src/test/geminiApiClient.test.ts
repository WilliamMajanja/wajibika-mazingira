import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock GoogleGenAI as a class (constructor)
const mockGenerateContentStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContentStream: mockGenerateContentStream,
        generateContent: mockGenerateContent,
      };
    },
    Modality: { AUDIO: 'AUDIO' },
  };
});

describe('geminiApiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockGenerateContentStream.mockReset();
    mockGenerateContent.mockReset();
  });

  describe('streamGeminiResponse', () => {
    it('throws when API key is not configured', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      const { streamGeminiResponse } = await import('../services/geminiApiClient');
      await expect(streamGeminiResponse('chat', {})).rejects.toThrow(
        'Gemini API key is not configured'
      );
    });

    it('throws for unsupported streaming task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const { streamGeminiResponse } = await import('../services/geminiApiClient');
      // The unsupported task should cause a throw inside the ReadableStream
      const stream = await streamGeminiResponse('unsupportedTask', {});
      const reader = stream.getReader();
      await expect(reader.read()).rejects.toThrow('Unsupported streaming task');
    });

    it('returns a ReadableStream for chat task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const mockStream = (async function* () {
        yield { text: 'Hello' };
        yield { text: ' World' };
      })();
      mockGenerateContentStream.mockResolvedValue(mockStream);

      const { streamGeminiResponse } = await import('../services/geminiApiClient');
      const stream = await streamGeminiResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
        model: 'test-model',
        systemInstruction: 'Be helpful',
      });

      expect(stream).toBeInstanceOf(ReadableStream);

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }
      expect(result).toBe('Hello World');
    });
  });

  describe('generateGeminiResponse', () => {
    it('throws for unsupported non-streaming task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const { generateGeminiResponse } = await import('../services/geminiApiClient');
      await expect(
        generateGeminiResponse('unsupportedTask', {})
      ).rejects.toThrow('Unsupported non-streaming task');
    });

    it('returns text and sources for groundedSearch task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      mockGenerateContent.mockResolvedValue({
        text: 'Search result',
        candidates: [
          {
            groundingMetadata: {
              groundingChunks: [{ web: { uri: 'https://example.com' } }],
            },
          },
        ],
      });

      const { generateGeminiResponse } = await import('../services/geminiApiClient');
      const result = await generateGeminiResponse('groundedSearch', {
        messages: [{ role: 'user', text: 'test' }],
        model: 'test-model',
        systemInstruction: 'instruction',
      });

      expect(result.text).toBe('Search result');
      expect(result.sources).toHaveLength(1);
    });

    it('returns audioContent for tts task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: 'base64audiocontent' } }],
            },
          },
        ],
      });

      const { generateGeminiResponse } = await import('../services/geminiApiClient');
      const result = await generateGeminiResponse('tts', {
        text: 'Hello',
        model: 'tts-model',
      });

      expect(result.audioContent).toBe('base64audiocontent');
    });
  });

  describe('generateTextToSpeech', () => {
    it('calls generateGeminiResponse with tts task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: 'audio123' } }],
            },
          },
        ],
      });

      const { generateTextToSpeech } = await import('../services/geminiApiClient');
      const result = await generateTextToSpeech('Say hello');
      expect(result.audioContent).toBe('audio123');
    });
  });
});
