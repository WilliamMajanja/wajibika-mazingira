import type { Handler, HandlerEvent } from "@netlify/functions";
import { getPool } from "../lib/db";

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
            const { id } = queryStringParameters || {};
            
            if (id) {
                // Fetch a single, complete evidence item
                const result = await client.query('SELECT * FROM evidence WHERE id = $1', [id]);
                if (result.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: "Evidence not found" }) };
                }
                return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
            } else {
                // Fetch all evidence items for the gallery view (without full file content)
                const result = await client.query(
                    'SELECT id, title, description, location, date_of_evidence, submitted_at, file_mime_type FROM evidence ORDER BY submitted_at DESC'
                );
                return { statusCode: 200, body: JSON.stringify(result.rows) };
            }
        }

        if (httpMethod === 'POST') {
            if (!body) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };
            }

            const { title, description, location, date_of_evidence, file_content, file_mime_type } = JSON.parse(body);
            const submittedAt = new Date().toISOString();
            
            if (!title || !location || !date_of_evidence) {
                 return { statusCode: 400, body: JSON.stringify({ error: 'Missing required evidence data (title, location, date).' }) };
            }

            const result = await client.query(
                `INSERT INTO evidence(title, description, location, date_of_evidence, submitted_at, file_content, file_mime_type)
                 VALUES($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [title, description, location, date_of_evidence, submittedAt, file_content, file_mime_type]
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
