// Cloudflare Pages Function: /api/track
let memoryLeads = [];

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const env = context.env;
    const now = new Date().toISOString();

    const sessionId = payload.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Check if Cloudflare KV is bound
    if (env && env.LEADS_KV) {
      let leads = [];
      const stored = await env.LEADS_KV.get('leads_all', { type: 'json' });
      if (stored && Array.isArray(stored)) {
        leads = stored;
      }

      const existingIndex = leads.findIndex(l => l.sessionId === sessionId || (payload.whatsapp && l.whatsapp && payload.whatsapp === l.whatsapp));
      const updatedLead = {
        sessionId,
        lastUpdated: now,
        ...(existingIndex >= 0 ? leads[existingIndex] : { createdAt: now, stageReached: 1 }),
        ...payload
      };

      if (existingIndex >= 0 && leads[existingIndex].stageReached > (payload.stageReached || 1)) {
        updatedLead.stageReached = leads[existingIndex].stageReached;
      }

      if (existingIndex >= 0) {
        leads[existingIndex] = updatedLead;
      } else {
        leads.unshift(updatedLead);
      }

      await env.LEADS_KV.put('leads_all', JSON.stringify(leads));

      return new Response(JSON.stringify({ success: true, lead: updatedLead }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // In-memory fallback
    const existingIndex = memoryLeads.findIndex(l => l.sessionId === sessionId || (payload.whatsapp && l.whatsapp && payload.whatsapp === l.whatsapp));
    const updatedLead = {
      sessionId,
      lastUpdated: now,
      ...(existingIndex >= 0 ? memoryLeads[existingIndex] : { createdAt: now, stageReached: 1 }),
      ...payload
    };

    if (existingIndex >= 0 && memoryLeads[existingIndex].stageReached > (payload.stageReached || 1)) {
      updatedLead.stageReached = memoryLeads[existingIndex].stageReached;
    }

    if (existingIndex >= 0) {
      memoryLeads[existingIndex] = updatedLead;
    } else {
      memoryLeads.unshift(updatedLead);
    }

    return new Response(JSON.stringify({ success: true, lead: updatedLead }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
