import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('aiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockFetch.mockReset();
  });

  describe('streamAIResponse', () => {
    it('throws when GitHub token is not configured', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', '');
      const { streamAIResponse } = await import('../services/aiClient');
      await expect(streamAIResponse('chat', {})).rejects.toThrow(
        'GitHub token is not configured'
      );
    });

    it('throws for unsupported streaming task', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');
      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('unsupportedTask', {});
      const reader = stream.getReader();
      await expect(reader.read()).rejects.toThrow('Unsupported streaming task');
    });

    it('returns a ReadableStream for chat task', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');

      // Simulate an SSE streaming response
      const sseBody = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: [DONE]\n\n',
      ].join('');
      const encoder = new TextEncoder();

      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseBody));
          controller.close();
        },
      });

      mockFetch.mockResolvedValue({
        ok: true,
        body: mockReadableStream,
      });

      const { streamAIResponse } = await import('../services/aiClient');
      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: 'hi' }],
        model: 'gpt-4o',
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
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');
      const { generateAIResponse } = await import('../services/aiClient');
      await expect(
        generateAIResponse('unsupportedTask', {})
      ).rejects.toThrow('Unsupported non-streaming task');
    });

    it('returns text and empty sources for groundedSearch task', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Search result' } }],
        }),
      });

      const { generateAIResponse } = await import('../services/aiClient');
      const result = await generateAIResponse('groundedSearch', {
        messages: [{ role: 'user', text: 'test' }],
        model: 'gpt-4o',
        systemInstruction: 'instruction',
      });

      expect(result.text).toBe('Search result');
      expect(result.sources).toEqual([]);
    });

    it('throws on API error response', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const { generateAIResponse } = await import('../services/aiClient');
      await expect(
        generateAIResponse('chat', {
          messages: [{ role: 'user', text: 'hi' }],
          model: 'gpt-4o',
        })
      ).rejects.toThrow('GitHub Models API error (401)');
    });
  });

  describe('speakText', () => {
    it('throws when speechSynthesis is not available', async () => {
      vi.stubEnv('VITE_GITHUB_TOKEN', 'test-token');

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
