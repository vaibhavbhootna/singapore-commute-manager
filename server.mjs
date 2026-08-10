import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const LTA_ACCOUNT_KEY = process.env.LTA_ACCOUNT_KEY || "JGy+GlkWTsqJFUgeMJxDNw==";

const server = http.createServer((req, res) => {
  // CORS Preflight Header Handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, *');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  
  // API Proxy Endpoint: /api/bus-arrival?BusStopCode=20251
  if (reqUrl.pathname === '/api/bus-arrival') {
    const busStopCode = reqUrl.searchParams.get('BusStopCode') || '20251';
    const ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${busStopCode}`;
    
    console.log(`[LIVE LTA PROXY] Request for BusStopCode: ${busStopCode}`);

    const ltaReq = https.request(ltaUrl, {
      method: 'GET',
      headers: {
        'AccountKey': LTA_ACCOUNT_KEY,
        'accept': 'application/json'
      }
    }, (ltaRes) => {
      let data = '';
      ltaRes.on('data', chunk => data += chunk);
      ltaRes.on('end', () => {
        res.writeHead(ltaRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    ltaReq.on('error', (err) => {
      console.error("[LTA PROXY ERROR]", err);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      });
      res.end(JSON.stringify({ error: err.message }));
    });

    ltaReq.end();
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  const extname = path.extname(filePath);
  let contentType = 'text/html';

  if (extname === '.js') contentType = 'text/javascript';
  if (extname === '.css') contentType = 'text/css';
  if (extname === '.json') contentType = 'application/json';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      res.end('File Not Found');
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*' 
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Live LTA Bus Arrival Server running at http://localhost:${PORT}`);
});
