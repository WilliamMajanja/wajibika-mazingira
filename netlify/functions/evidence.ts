import type { Handler, HandlerEvent } from "@netlify/functions";
import { getPool } from "../lib/db";
import { GoogleGenAI } from "@google/genai";

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


export const handler: Handler = async (event: HandlerEvent) => {
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

    try {
        if (httpMethod === 'GET') {
            const { id, assessment_id } = queryStringParameters || {};
            
            if (id) {
                // Fetch a single, complete evidence item
                const result = await client.query('SELECT * FROM evidence WHERE id = $1', [id]);
                if (result.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: "Evidence not found" }) };
                }
                return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
            } else if (assessment_id) {
                 // Fetch all evidence for a specific assessment
                const result = await client.query(
                    'SELECT * FROM evidence WHERE assessment_id = $1 ORDER BY submitted_at DESC',
                    [assessment_id]
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
                const evidenceResult = await client.query('SELECT file_content, file_mime_type FROM evidence WHERE id = $1', [payload.evidenceId]);
                if (evidenceResult.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: 'Evidence not found.' }) };
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