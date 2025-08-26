
import { AssessmentReport, AssessmentType } from "../types";

export const generateAssessmentReport = async (
    assessmentType: AssessmentType,
    projectName: string,
    projectLocation: string,
    projectDescription: string,
    apiKey: string | null // This parameter is no longer used but kept for compatibility.
): Promise<AssessmentReport> => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const response = await fetch('/api/generate-assessment', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                assessmentType,
                projectName,
                projectLocation,
                projectDescription,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
            throw new Error(errorData.error || `An unknown error occurred.`);
        }
        
        // The backend function is responsible for cleaning and returning a valid JSON object.
        // We can directly parse the JSON response.
        const parsedReport: AssessmentReport = await response.json();
        return parsedReport;

    } catch (error: any) {
        console.error("Error calling generate assessment function:", error);
        if (error instanceof SyntaxError) {
            // This can happen if the AI response is not valid JSON
            throw new Error("The AI returned an invalid response format. Please try generating the report again.");
        }
        throw new Error(error.message || "Failed to generate the assessment report. Please check the project details and try again.");
    }
};
