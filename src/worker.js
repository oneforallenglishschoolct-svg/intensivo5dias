let memoryLeads = [];

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
        if (env && env.LEADS_KV) {
          try {
            const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
            if (stored && Array.isArray(stored)) leads = stored;
          } catch(e) {}
        }

        if (leads.length === 0 && memoryLeads.length > 0) {
          leads = memoryLeads;
        }

        const existingIndex = leads.findIndex(l =>
          l.sessionId === sessionId ||
          (payload.whatsapp && l.whatsapp && payload.whatsapp.replace(/\D/g, '') === l.whatsapp.replace(/\D/g, ''))
        );

        const inputStage = payload.stageReached || 1;

        const updatedLead = {
          sessionId,
          lastUpdated: now,
          createdAt: existingIndex >= 0 ? (leads[existingIndex].createdAt || now) : now,
          stageReached: inputStage,
          ...(existingIndex >= 0 ? leads[existingIndex] : {}),
          ...payload,
        };

        if (existingIndex >= 0 && leads[existingIndex].stageReached > inputStage) {
          updatedLead.stageReached = leads[existingIndex].stageReached;
        } else if (inputStage > (updatedLead.stageReached || 0)) {
          updatedLead.stageReached = inputStage;
        }

        if (existingIndex >= 0) {
          leads[existingIndex] = updatedLead;
        } else {
          leads.unshift(updatedLead);
        }

        memoryLeads = leads;

        if (env && env.LEADS_KV) {
          try {
            await env.LEADS_KV.put('leads_all', JSON.stringify(leads));
          } catch(e) {}
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
      if (env && env.LEADS_KV) {
        try {
          const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
          if (stored && Array.isArray(stored)) leads = stored;
        } catch(e) {}
      }
      if (leads.length === 0) {
        leads = memoryLeads;
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
