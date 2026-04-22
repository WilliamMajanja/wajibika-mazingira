import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @google/genai module
const mockGenerateContentStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: function GoogleGenAI() {
            return {
                models: {
                    generateContentStream: mockGenerateContentStream,
                    generateContent: mockGenerateContent,
                },
            };
        },
    };
});

describe('aiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockGenerateContentStream.mockReset();
    mockGenerateContent.mockReset();
  });

  describe('streamAIResponse', () => {
    it('throws when Gemini API key is not configured', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      const { streamAIResponse } = await import('../services/aiClient');
      await expect(streamAIResponse('chat', {})).rejects.toThrow(
        'Gemini API key is not configured'
      );
    });

    it('throws for unsupported streaming task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('unsupportedTask', {});
      const reader = stream.getReader();
      await expect(reader.read()).rejects.toThrow('Unsupported streaming task');
    });

    it('throws for transcribeAudio task (no longer supported)', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('transcribeAudio', {});
      const reader = stream.getReader();
      await expect(reader.read()).rejects.toThrow('Unsupported streaming task');
    });

    it('returns a ReadableStream for chat task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');

      // Simulate Gemini streaming response
      const mockAsyncIterator = (async function* () {
        yield { text: 'Hello' };
        yield { text: ' World' };
      })();
      mockGenerateContentStream.mockResolvedValue(mockAsyncIterator);

      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
        model: 'gemini-2.0-flash',
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

  describe('generateAIResponse', () => {
    it('throws for unsupported non-streaming task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      const { generateAIResponse } = await import('../services/aiClient');
      await expect(
        generateAIResponse('unsupportedTask', {})
      ).rejects.toThrow('Unsupported non-streaming task');
    });

    it('returns text and sources for groundedSearch task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      mockGenerateContent.mockResolvedValue({
        text: 'Search result',
        candidates: [{
          groundingMetadata: {
            groundingChunks: [{ web: { uri: 'https://example.com', title: 'Example' } }],
          },
        }],
      });

      const { generateAIResponse } = await import('../services/aiClient');
      const result = await generateAIResponse('groundedSearch', {
        messages: [{ role: 'user', text: 'test' }],
        model: 'gemini-2.0-flash',
        systemInstruction: 'instruction',
      });

      expect(result.text).toBe('Search result');
      expect(result.sources).toEqual([{ web: { uri: 'https://example.com', title: 'Example' } }]);
    });

    it('returns text and empty sources for chat task', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
      mockGenerateContent.mockResolvedValue({
        text: 'Chat response',
        candidates: [{}],
      });

      const { generateAIResponse } = await import('../services/aiClient');
      const result = await generateAIResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
        model: 'gemini-2.0-flash',
      });

      expect(result.text).toBe('Chat response');
      expect(result.sources).toEqual([]);
    });
  });

  describe('speakText', () => {
    it('throws when speechSynthesis is not available', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');

      // Temporarily remove speechSynthesis from window
      const original = (window as any).speechSynthesis;
      delete (window as any).speechSynthesis;

      const { speakText } = await import('../services/aiClient');
      expect(() => speakText('hello')).toThrow('Text-to-speech is not supported');

      // Restore
      (window as any).speechSynthesis = original;
    });
  });
});
