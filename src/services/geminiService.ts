
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
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        // The backend should return a JSON error object
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Fallback if the error response is not JSON
        errorMessage = await response.text() || errorMessage;
      }
      throw new Error(errorMessage);
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
    // Re-throw the error to be caught and displayed by the component
    throw error;
  }
};
