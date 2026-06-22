const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  // Graceful decoding of URL path to avoid character errors
  let reqUrl = decodeURIComponent(req.url);
  
  // Resolve path
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);
  
  // Check that the requested file path stays within this directory (security check)
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 File Not Found</h1><p>The requested file does not exist.</p>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Function to find an available port and start server
function startServer(port) {
  server.listen(port, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Arkoo Prebuild Landing Page local server is running!`);
    console.log(`👉 Access URL: http://localhost:${port}/`);
    console.log(`==================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, attempting next port...`);
      startServer(port + 1);
    } else {
      console.error('Server failed to start:', err);
    }
  });
}

startServer(PORT);
