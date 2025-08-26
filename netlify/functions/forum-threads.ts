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
    const threadId = queryStringParameters?.id;
    const client = await pool.connect();

    try {
        if (httpMethod === 'GET') {
            if (threadId) {
                const threadResult = await client.query('SELECT * FROM forum_threads WHERE id = $1', [threadId]);
                if (threadResult.rows.length === 0) {
                    return { statusCode: 404, body: JSON.stringify({ error: "Thread not found" }) };
                }
                const messagesResult = await client.query(
                    'SELECT * FROM forum_messages WHERE thread_id = $1 ORDER BY created_at ASC',
                    [threadId]
                );
                const thread = { ...threadResult.rows[0], messages: messagesResult.rows };
                return { statusCode: 200, body: JSON.stringify(thread) };
            }
            const result = await client.query('SELECT * FROM forum_threads ORDER BY last_reply_at DESC');
            return { statusCode: 200, body: JSON.stringify(result.rows) };
        }

        if (httpMethod === 'POST') {
            const user = context.clientContext?.user;
            if (!user) return { statusCode: 401, body: JSON.stringify({ error: 'You must be logged in to create a thread.' }) };
            if (!body) return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };

            const { title, content } = JSON.parse(body);
            if (!title || !content) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Missing title or content' }) };
            }

            // Construct the author object from the standard JWT claims.
            const author = {
                id: user.sub,
                name: user.name || user.email, // Fallback to email if name is not present
                picture: user.picture
            };

            await client.query('BEGIN');
            const threadResult = await client.query(
                `INSERT INTO forum_threads (title, author, reply_count, last_reply_at, created_at)
                 VALUES ($1, $2, 1, NOW(), NOW())
                 RETURNING *`,
                [title, author]
            );
            const newThread = threadResult.rows[0];
            await client.query(
                `INSERT INTO forum_messages (thread_id, author, content, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [newThread.id, author, content]
            );
            await client.query('COMMIT');
            
            return { statusCode: 201, body: JSON.stringify(newThread) };
        }

        return { statusCode: 405, headers: { 'Allow': 'GET, POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    } catch (error: any) {
        if (client) await client.query('ROLLBACK').catch(console.error);
        console.error("Error in forum-threads function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'A database error occurred.' }) };
    } finally {
        if (client) client.release();
    }
};