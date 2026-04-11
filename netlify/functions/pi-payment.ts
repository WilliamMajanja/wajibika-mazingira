// netlify/functions/pi-payment.ts

import type { Context } from '@netlify/functions';

const PI_API_BASE = 'https://api.minepi.com';
const { PI_API_KEY } = process.env;

/**
 * Server-side handler for Pi payment lifecycle.
 *
 * Accepts POST with JSON body:
 *   { action: 'approve', paymentId: string }
 *   { action: 'complete', paymentId: string, txId: string }
 */
export default async (req: Request, _context: Context) => {
  if (!PI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Pi API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action, paymentId, txId } = body as {
      action: string;
      paymentId?: string;
      txId?: string;
    };

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (action === 'approve') {
      const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Pi approve failed: ${errText}` }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'complete') {
      if (!txId) {
        return new Response(JSON.stringify({ error: 'txId is required for completion' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ txid: txId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Pi complete failed: ${errText}` }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const error = e as Error;
    console.error('Pi payment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
