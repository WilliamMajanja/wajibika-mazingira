import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { getPool } from "../lib/db";

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

    const { httpMethod, queryStringParameters, body } = event;
    const client = await pool.connect();

    try {
        if (httpMethod === 'GET') {
            const threadId = queryStringParameters?.threadId;
            if (!threadId) return { statusCode: 400, body: JSON.stringify({ error: 'threadId is required' }) };
            const result = await client.query('SELECT * FROM forum_messages WHERE thread_id = $1 ORDER BY created_at ASC', [threadId]);
            return { statusCode: 200, body: JSON.stringify(result.rows) };
        }

        if (httpMethod === 'POST') {
            const user = context.clientContext?.user;
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'You must be logged in to post a reply.' }) };
            if (!body) return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };

            const { threadId, content } = JSON.parse(body);
            if (!threadId || !content) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Missing threadId or content' }) };
            }

            // Construct the author object from standard JWT claims
            const author = {
                id: user.sub,
                name: user.name || user.email,
                picture: user.picture
            };

            await client.query('BEGIN');
            const messageResult = await client.query(
                `INSERT INTO forum_messages (thread_id, author, content, created_at)
                 VALUES ($1, $2, $3, NOW())
                 RETURNING *`,
                [threadId, author, content]
            );
            await client.query(
                `UPDATE forum_threads SET reply_count = reply_count + 1, last_reply_at = NOW() WHERE id = $1`,
                [threadId]
            );
            await client.query('COMMIT');

            return { statusCode: 201, body: JSON.stringify(messageResult.rows[0]) };
        }

        return { statusCode: 405, headers: { 'Allow': 'GET, POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    } catch (error: any) {
        if(client) await client.query('ROLLBACK').catch(console.error);
        console.error("Error creating message:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'A database error occurred.' }) };
    } finally {
        if(client) client.release();
    }
};
