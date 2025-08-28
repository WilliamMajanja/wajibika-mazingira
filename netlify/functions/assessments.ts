import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getPool } from '../lib/db';

const ROLES_CLAIM = 'https://wajibika.app/roles';

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
            if (!user) {
                console.error("Authentication error in 'assessments GET': context.clientContext.user is missing. This could be due to a misconfigured JWT secret in Netlify's settings.");
                console.log("Client context:", JSON.stringify(context.clientContext, null, 2));
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed. You must be logged in to view assessments.' }) };
            }

            const { id } = queryStringParameters || {};

            if (id) {
                // Fetch a single assessment by ID
                const result = await client.query(
                    'SELECT * FROM assessments WHERE id = $1 AND user_id = $2',
                    [id, user.sub]
                );
                if (result.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: 'Assessment not found.' }) };
                }
                return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
            } else {
                // Fetch all assessments for the user
                const result = await client.query(
                    'SELECT * FROM assessments WHERE user_id = $1 ORDER BY date DESC',
                    [user.sub] // 'sub' (subject) is the standard user ID claim in JWTs.
                );
                return { statusCode: 200, body: JSON.stringify(result.rows) };
            }
        }

        if (httpMethod === 'POST') {
             if (!user) {
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed. You must be logged in to create an assessment.' }) };
            }

            // Role-based access control check
            const roles = user[ROLES_CLAIM] || [];
            if (!roles.includes('Practitioner') && !roles.includes('Admin')) {
                return { statusCode: 403, body: JSON.stringify({ error: 'You do not have permission to create an assessment.' }) };
            }

            if (!body) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };
            }
            
            const { project_name, location, date, type, report, manual_form } = JSON.parse(body);

            if (!project_name || !location || !date || !type || (!report && !manual_form)) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Missing required assessment data' }) };
            }

            const result = await client.query(
                `INSERT INTO assessments(user_id, project_name, location, date, type, report, manual_form)
                 VALUES($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [user.sub, project_name, location, date, type, report, manual_form]
            );

            return { statusCode: 201, body: JSON.stringify(result.rows[0]) };
        }

        return {
            statusCode: 405,
            headers: { 'Allow': 'GET, POST' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    } catch (error: any) {
        console.error("Database error in assessments function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'A database error occurred.' }) };
    } finally {
        client.release();
    }
};