const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dataDir = path.join(root, 'data');
const storeFile = path.join(dataDir, 'app-store.json');
const port = Number(process.env.PORT || 8000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, '[]\n');
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
  });
}

function cleanApp(input) {
  const html = String(input.html || '').trim();
  return {
    id: Date.now().toString(36),
    name: String(input.name || 'Untitled HTML App').slice(0, 80),
    author: String(input.author || 'RohanOS Creator').slice(0, 80),
    description: String(input.description || 'Created in RohanOS Studio').slice(0, 240),
    html: html.startsWith('<!doctype html>') || html.startsWith('<html') ? html : `<!doctype html>\n${html}`,
    createdAt: new Date().toISOString()
  };
}

async function handleApi(req, res) {
  ensureStore();
  if (req.method === 'GET' && req.url === '/api/apps') {
    send(res, 200, fs.readFileSync(storeFile, 'utf8'));
    return;
  }
  if (req.method === 'POST' && req.url === '/api/publish') {
    const app = cleanApp(JSON.parse(await readBody(req) || '{}'));
    const apps = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    apps.unshift(app);
    fs.writeFileSync(storeFile, `${JSON.stringify(apps, null, 2)}\n`);
    send(res, 201, JSON.stringify(app, null, 2));
    return;
  }
  send(res, 404, JSON.stringify({ error: 'Not found' }));
}

function serveFile(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.normalize(path.join(root, urlPath));
  if (!filePath.startsWith(root)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      return;
    }
    send(res, 200, data, types[path.extname(filePath)] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    handleApi(req, res);
    return;
  }
  serveFile(req, res);
});

server.listen(port, () => {
  console.log(`RohanOS desktop server running at http://localhost:${port}`);
});
