// Cloudflare Pages Function: /api/leads
export async function onRequestGet(context) {
  try {
    const env = context.env;
    let leads = [];

    if (env && env.LEADS_KV) {
      const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
      if (stored && Array.isArray(stored)) {
        leads = stored;
      }
    }

    return new Response(JSON.stringify(leads), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
