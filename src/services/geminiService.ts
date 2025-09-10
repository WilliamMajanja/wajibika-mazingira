import type { Assessment } from '../types';

export const generateImpactAssessment = async (
  projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>,
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'assessment',
        details: projectDetails,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Try to parse as JSON, but fall back to text if it fails
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        } catch {
             throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }
    }

    if (!response.body) {
      throw new Error("Response body is missing");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      onChunk(decoder.decode(value, { stream: true }));
    }
  } catch (error) {
    console.error("Error generating impact assessment:", error);
    // Re-throw the error to be caught by the component
    throw error;
  }
};