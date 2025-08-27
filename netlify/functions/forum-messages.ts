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
            if (!user) {
                console.error("Authentication error in 'forum-messages POST': context.clientContext.user is missing. This could be due to a misconfigured JWT secret in Netlify's settings.");
                console.log("Client context:", JSON.stringify(context.clientContext, null, 2));
                return { statusCode: 401, body: JSON.stringify({ error: 'Authentication failed. You must be logged in to interact with the forum.' }) };
            }
            if (!body) return { statusCode: 400, body: JSON.stringify({ error: 'Request body is missing' }) };

            const payload = JSON.parse(body);
            
            // --- Route action: Toggle Like ---
            if (payload.action === 'toggle_like') {
                const { messageId } = payload;
                if (!messageId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing messageId' }) };
                
                await client.query('BEGIN');
                const messageResult = await client.query('SELECT liked_by FROM forum_messages WHERE id = $1 FOR UPDATE', [messageId]);
                if (messageResult.rows.length === 0) {
                     await client.query('ROLLBACK');
                    return { statusCode: 404, body: JSON.stringify({ error: 'Message not found' }) };
                }

                const likedBy: string[] = messageResult.rows[0].liked_by || [];
                const userId = user.sub;
                let updatedMessage;

                if (likedBy.includes(userId)) {
                    // User has liked, so unlike
                    updatedMessage = await client.query(
                        `UPDATE forum_messages
                         SET likes = likes - 1, liked_by = array_remove(liked_by, $1)
                         WHERE id = $2 RETURNING *`,
                         [userId, messageId]
                    );
                } else {
                    // User has not liked, so like
                    updatedMessage = await client.query(
                        `UPDATE forum_messages
                         SET likes = likes + 1, liked_by = array_append(liked_by, $1)
                         WHERE id = $2 RETURNING *`,
                         [userId, messageId]
                    );
                }
                await client.query('COMMIT');
                return { statusCode: 200, body: JSON.stringify(updatedMessage.rows[0]) };
            }

            // --- Default action: Create Message ---
            const { threadId, content } = payload;
            if (!threadId || !content) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Missing threadId or content' }) };
            }

            const author = { id: user.sub, name: user.name || user.email, picture: user.picture };

            await client.query('BEGIN');
            const messageResult = await client.query(
                `INSERT INTO forum_messages (thread_id, author, content, created_at, liked_by)
                 VALUES ($1, $2, $3, NOW(), '{}')
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
        console.error("Error in forum-messages function:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || 'A database error occurred.' }) };
    } finally {
        if(client) client.release();
    }
};