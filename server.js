const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'leads_db.json');

// Helper to load leads from database file
function getLeads() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error reading leads DB:', err);
  }
  return [];
}

// Helper to save leads to database file
function saveLeads(leads) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving leads DB:', err);
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = req.url.split('?')[0];

  // API Endpoint: GET /api/leads
  if (reqPath === '/api/leads' && req.method === 'GET') {
    const leads = getLeads();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(JSON.stringify(leads));
    return;
  }

  // API Endpoint: POST /api/track
  if (reqPath === '/api/track' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const leads = getLeads();

        const now = new Date().toISOString();
        const sessionId = payload.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const existingIndex = leads.findIndex(l =>
          l.sessionId === sessionId ||
          (payload.whatsapp && l.whatsapp && payload.whatsapp.replace(/\D/g, '') === l.whatsapp.replace(/\D/g, ''))
        );

        const existingLead = existingIndex >= 0 ? leads[existingIndex] : {};
        const inputStage = payload.stageReached || 1;

        const preserve = (key) => {
          const val = payload[key];
          if (val !== undefined && val !== null && val !== '') return val;
          return existingLead[key] || '';
        };

        const updatedLead = {
          ...existingLead,
          ...payload,
          sessionId,
          createdAt: existingLead.createdAt || now,
          lastUpdated: now,
          stageReached: Math.max(existingLead.stageReached || 1, inputStage || 1),
          nome: preserve('nome'),
          whatsapp: preserve('whatsapp'),
          email: preserve('email'),
          idiomaFoco: preserve('idiomaFoco'),
          nivel: preserve('nivel'),
          experiencia: preserve('experiencia'),
          objetivo: preserve('objetivo'),
          origem: preserve('origem'),
          plano: preserve('plano'),
          valor: preserve('valor'),
        };

        if (existingIndex >= 0) {
          leads[existingIndex] = updatedLead;
        } else {
          leads.unshift(updatedLead);
        }

        saveLeads(leads);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        });
        res.end(JSON.stringify({ success: true, lead: updatedLead }));
      } catch (err) {
        console.error('Error in /api/track:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);
  
  // Anti-cache headers for static files
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading index.html');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin.html`);
});

