export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ========== API: POST /api/track ==========
    if (path === '/api/track' && request.method === 'POST') {
      try {
        const payload = await request.json();
        const now = new Date().toISOString();
        const sessionId = payload.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        let leads = [];
        if (env.LEADS_KV) {
          const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
          if (stored && Array.isArray(stored)) leads = stored;
        }

        const existingIndex = leads.findIndex(l =>
          l.sessionId === sessionId ||
          (payload.whatsapp && l.whatsapp && payload.whatsapp === l.whatsapp)
        );

        const updatedLead = {
          sessionId,
          lastUpdated: now,
          ...(existingIndex >= 0 ? leads[existingIndex] : { createdAt: now, stageReached: 1 }),
          ...payload,
        };

        // Preserve highest stage reached
        if (existingIndex >= 0 && leads[existingIndex].stageReached > (payload.stageReached || 1)) {
          updatedLead.stageReached = leads[existingIndex].stageReached;
        }

        if (existingIndex >= 0) {
          leads[existingIndex] = updatedLead;
        } else {
          leads.unshift(updatedLead);
        }

        if (env.LEADS_KV) {
          await env.LEADS_KV.put('leads_all', JSON.stringify(leads));
        }

        return new Response(JSON.stringify({ success: true, lead: updatedLead }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ========== API: GET /api/leads ==========
    if (path === '/api/leads' && request.method === 'GET') {
      let leads = [];
      if (env.LEADS_KV) {
        const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
        if (stored && Array.isArray(stored)) leads = stored;
      }

      return new Response(JSON.stringify(leads), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
        },
      });
    }

    // ========== Everything else: serve static assets ==========
    return env.ASSETS.fetch(request);
  },
};
