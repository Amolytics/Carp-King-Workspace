const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, 'from', req.ip);
  next();
});

// Proxy API requests to backend service if configured
const { URL } = require('url');
const http = require('http');
const https = require('https');
const RAW_BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000');
const BACKEND_URL = RAW_BACKEND_URL && String(RAW_BACKEND_URL).trim();
console.log('Using BACKEND_URL:', JSON.stringify(RAW_BACKEND_URL));
app.use('/api', (req, res) => {
  try {
    const cleanBase = (BACKEND_URL || 'http://localhost:4000').replace(/\s+/g, '');
    const targetHref = cleanBase.replace(/\/$/, '') + req.originalUrl;
    const target = new URL(targetHref);
    console.log('Proxy target:', target.href, ' (constructed from)', JSON.stringify(cleanBase), req.originalUrl);
    const lib = target.protocol === 'https:' ? https : http;
    const options = {
      method: req.method,
      headers: Object.assign({}, req.headers, { host: target.host }),
    };
    const proxyReq = lib.request(target, options, proxyRes => {
      res.statusCode = proxyRes.statusCode || 200;
      Object.entries(proxyRes.headers || {}).forEach(([k, v]) => {
        if (v !== undefined) res.setHeader(k, v);
      });
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', err => {
      console.error('proxy error', err);
      res.status(502).json({ error: 'Bad gateway', details: String(err) });
    });
    if (req.readable) req.pipe(proxyReq, { end: true });
  } catch (err) {
    console.error('proxy setup error', err);
    res.status(500).json({ error: 'Proxy error', details: String(err) });
  }
});

// simple health endpoint for healthchecks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// serve static build
const staticDir = path.join(__dirname, 'dist');

// Serve index.html with runtime injection for the root path before static middleware
app.get(['/', '/index.html'], (req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  try {
    let html = require('fs').readFileSync(indexPath, 'utf8');
    const apiUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/,'');
    const socketUrl = (process.env.SOCKET_URL || apiUrl).replace(/\/+$/,'');
    const snippet = `\n    <script>window.__API_URL__ = '${apiUrl.replace(/'/g, "\\'")}'+ '/api'; window.__SOCKET_URL__ = '${socketUrl.replace(/'/g, "\\'")}';</script>\n`;
    if (html.indexOf('</head>') !== -1) {
      html = html.replace('</head>', snippet + '</head>');
    } else {
      html = snippet + html;
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Failed to read index for runtime injection', err);
    res.sendFile(indexPath);
  }
});

app.use(express.static(staticDir));

// catch-all to support SPA routing
app.get('*', (req, res) => {
  // Serve index.html but inject runtime overrides for API and socket URLs
  const indexPath = path.join(staticDir, 'index.html');
  try {
    let html = require('fs').readFileSync(indexPath, 'utf8');
    const apiUrl = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/,'');
    const socketUrl = (process.env.SOCKET_URL || apiUrl).replace(/\/+$/,'');
    const snippet = `\n    <script>window.__API_URL__ = '${apiUrl.replace(/'/g, "\\'")}'+ '/api'; window.__SOCKET_URL__ = '${socketUrl.replace(/'/g, "\\'")}';</script>\n`;
    // inject before closing </head> if present, otherwise prepend
    if (html.indexOf('</head>') !== -1) {
      html = html.replace('</head>', snippet + '</head>');
    } else {
      html = snippet + html;
    }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Failed to read/serve index.html with runtime snippet', err);
    res.sendFile(path.join(staticDir, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
