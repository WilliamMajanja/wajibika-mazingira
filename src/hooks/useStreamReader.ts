import * as React from 'react';

const DEFAULT_STREAM_TIMEOUT = 30000; // 30 seconds without data
const DEFAULT_TOTAL_TIMEOUT = 300000; // 5 minutes total response time

export interface StreamReaderOptions {
  /** Timeout in ms for each chunk. If no data received within this time, abort. */
  streamTimeout?: number;
  /** Total timeout in ms for the entire stream. Abort if not completed within this time. */
  totalTimeout?: number;
}

export function useStreamReader() {
  const abortRef = React.useRef<AbortController | null>(null);

  const readStream = React.useCallback(
    async (
      stream: ReadableStream<Uint8Array>,
      onChunk: (text: string) => void,
      onDone?: () => void,
      options?: StreamReaderOptions,
    ): Promise<void> => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const streamTimeout = options?.streamTimeout ?? DEFAULT_STREAM_TIMEOUT;
      const totalTimeout = options?.totalTimeout ?? DEFAULT_TOTAL_TIMEOUT;

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      let chunkTimer: ReturnType<typeof setTimeout> | null = null;
      let totalTimer: ReturnType<typeof setTimeout> | null = null;
      let abortReason: 'stream' | 'total' | null = null;

      const cleanup = () => {
        if (chunkTimer) { clearTimeout(chunkTimer); chunkTimer = null; }
        if (totalTimer) { clearTimeout(totalTimer); totalTimer = null; }
      };

      const resetChunkTimer = () => {
        if (chunkTimer) clearTimeout(chunkTimer);
        chunkTimer = setTimeout(() => {
          abortReason = 'stream';
          abort.abort();
        }, streamTimeout);
      };

      try {
        totalTimer = setTimeout(() => {
          abortReason = 'total';
          abort.abort();
        }, totalTimeout);

        resetChunkTimer();

        while (true) {
          if (abort.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          resetChunkTimer();
          onChunk(decoder.decode(value, { stream: true }));
        }
        onDone?.();
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
          if (!abortReason) return;
          const err = new Error(
            abortReason === 'total'
              ? `AI response timed out: total time exceeded ${totalTimeout / 1000}s.`
              : `AI response timed out: no data received for ${streamTimeout / 1000}s.`,
          );
          err.cause = abortReason;
          throw err;
        }
        throw e;
      } finally {
        cleanup();
        reader.releaseLock();
        if (abortRef.current === abort) abortRef.current = null;
      }
    },
    [],
  );

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  React.useEffect(() => () => abort(), [abort]);

  return { readStream, abort };
}
