import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getPool } from "../lib/db";
import { GoogleGenAI } from "@google/genai";
// FIX: Import Buffer to resolve TypeScript error 'Cannot find name 'Buffer''.
import { Buffer } from "buffer";

const GEMINI_MODEL = 'gemini-2.5-flash';

const summarizeEvidence = async (apiKey: string, evidenceText: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Please provide a concise summary of the following document/text which has been submitted as evidence in an environmental case. Focus on the key facts, figures, and potential legal implications mentioned. Keep it brief and to the point.\n\n---\n\n${evidenceText}`;
    
    const result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
    });

    return result.text;
}


export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const pool = getPool();
    if (!pool) {
        console.error("DATABASE_URL is not configured.");
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "The application's database is not configured. Please contact the administrator." }),
        };
    }

    const { httpMethod, body, queryStringParameters } = event;
    const client = await pool.connect();
    const user = context.clientContext?.user;

    try {
        if (httpMethod === 'GET') {
            const { id, assessment_id } = queryStringParameters || {};
            
            if (id) {
                // Fetch a single, complete evidence item, checking permissions.
                // It's public if assessment_id is NULL. If not, user must own the assessment.
                const result = await client.query(
                    `SELECT e.* FROM evidence e
                     LEFT JOIN assessments a ON e.assessment_id = a.id
                     WHERE e.id = $1 AND (e.assessment_id IS NULL OR a.user_id = $2)`,
                    [id, user?.sub]
                );
                if (result.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: "Evidence not found or permission denied" }) };
                }
                return { statusCode: 200, body: JSON.stringify(result.rows[0]) };

            } else if (assessment_id) {
                if (!user) {
                    return { statusCode: 401, body: JSON.stringify({ error: 'You must be logged in to view assessment evidence.' }) };
                }
                // Fetch all evidence for a specific assessment, ensuring user owns the assessment
                const result = await client.query(
                    `SELECT e.* FROM evidence e
                     JOIN assessments a ON e.assessment_id = a.id
                     WHERE e.assessment_id = $1 AND a.user_id = $2
                     ORDER BY e.submitted_at DESC`,
                    [assessment_id, user.sub]
                );
                return { statusCode: 200, body: JSON.stringify(result.rows) };
            } else {
                // Fetch all general evidence items for the gallery view (without full file content, assessment_id IS NULL)
                const result = await client.query(
                    'SELECT id, title, description, location, date_of_evidence, submitted_at, file_mime_type, tags FROM evidence WHERE assessment_id IS NULL ORDER BY submitted_at DESC'
                );
                return { statusCode: 200, body: JSON.stringify(result.rows) };
            }
        }

        if (httpMethod === 'POST') {
            if (!user) {
                console.error("Authentication error in 'evidence POST': context.clientContext.user is missing. User must be logged in to submit or summarize evidence.");
                return { statusCode: 401, body: JSON.stringify({ error: 'You must be logged in to perform this action.' }) };
            }

            if (!body) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };
            }
            
            const payload = JSON.parse(body);
            
            // Route to different actions based on payload
            if (payload.action === 'summarize') {
                 const apiKey = process.env.API_KEY;
                 if (!apiKey) {
                     return { statusCode: 500, body: JSON.stringify({ error: "AI service not configured." }) };
                 }
                // Check that user has permission to summarize this evidence
                const evidenceResult = await client.query(
                    `SELECT e.file_content, e.file_mime_type FROM evidence e
                     LEFT JOIN assessments a ON e.assessment_id = a.id
                     WHERE e.id = $1 AND (e.assessment_id IS NULL OR a.user_id = $2)`,
                    [payload.evidenceId, user.sub]
                );
                if (evidenceResult.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: 'Evidence not found or you do not have permission to access it.' }) };
                }

                const evidence = evidenceResult.rows[0];
                if (!evidence.file_content || !evidence.file_mime_type?.startsWith('text')) {
                     return { statusCode: 400, body: JSON.stringify({ error: 'Summarization is only available for text-based files.' }) };
                }

                // The file content is Base64 encoded, so we need to decode it first.
                const fileText = Buffer.from(evidence.file_content, 'base64').toString('utf-8');

                const summary = await summarizeEvidence(apiKey, fileText);

                return { statusCode: 200, body: JSON.stringify({ summary }) };
            }


            // Default action: Create new evidence
            const { title, description, location, date_of_evidence, file_content, file_mime_type, tags, assessment_id } = payload;
            const submittedAt = new Date().toISOString();
            
            if (!title || !location || !date_of_evidence) {
                 return { statusCode: 400, body: JSON.stringify({ error: 'Missing required evidence data (title, location, date).' }) };
            }
            
            // The pg driver handles array conversion automatically for TEXT[] columns
            const tagsArray = tags && tags.length > 0 ? tags : null;

            const result = await client.query(
                `INSERT INTO evidence(title, description, location, date_of_evidence, submitted_at, file_content, file_mime_type, tags, assessment_id)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [title, description, location, date_of_evidence, submittedAt, file_content, file_mime_type, tagsArray, assessment_id]
            );

            return { statusCode: 201, body: JSON.stringify(result.rows[0]) };
        }

        return {
            statusCode: 405,
            headers: { 'Allow': 'GET, POST' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    } catch (error: any) {
        console.error("Database error in evidence function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'A database error occurred.' }) };
    } finally {
        client.release();
    }
};