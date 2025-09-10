import type { Assessment } from '../types';

export const generateImpactAssessment = async (
  projectDetails: Omit<Assessment, 'id' | 'report' | 'createdAt'>
): Promise<string> => {
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
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.report;
  } catch (error) {
    console.error("Error generating impact assessment:", error);
    // Re-throw the error to be caught by the component
    throw error;
  }
};
