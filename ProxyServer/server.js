const express = require('express');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: true,
    credentials: true
}));
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'req.config.json');
const LOGS_FILE = path.join(__dirname, 'logs.jsonl');

// Global Config State
let config = {};

// Load Config
function loadConfig() {
    try {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        config = JSON.parse(data); // Atomic in Node.js for small files
        console.log('Configuration loaded:', new Date().toISOString());
        console.log(`[MODE] Experiments Enabled: ${config.experimentsEnabled}`);
    } catch (err) {
        console.error('Error loading config:', err.message);
    }
}

// Initial Load & Watch
loadConfig();
fs.watch(CONFIG_FILE, (eventType) => {
    if (eventType === 'change') {
        console.log('Config file changed, reloading...');
        // Debounce slightly to avoid read-during-write
        setTimeout(loadConfig, 50);
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper: Log Request
function logRequest(logEntry) {
    const line = JSON.stringify(logEntry) + '\n';
    fs.appendFile(LOGS_FILE, line, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
}

// Helper: Match Route
function matchRoute(method, urlPath) {
    if (!config.routes) return null;
    // Find first matching route
    return config.routes.find(r => 
        r.match.method === method && urlPath.startsWith(r.match.path)
    );
}

// Dashboard APIs
app.get('/dashboard/config', (req, res) => res.json(config));

app.post('/dashboard/config', (req, res) => {
    try {
        // Toggle or set specific value
        if (typeof req.body.experimentsEnabled === 'boolean') {
            config.experimentsEnabled = req.body.experimentsEnabled;
            // Write back to disk to persist
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
            res.json({ status: 'ok', experimentsEnabled: config.experimentsEnabled });
        } else {
            res.status(400).json({ error: 'Invalid payload. Expect { "experimentsEnabled": boolean }' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/dashboard/logs', (req, res) => {
    fs.readFile(LOGS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        const lines = data.trim().split('\n').slice(-50)
            .map(l => { try { return JSON.parse(l) } catch { return null } })
            .filter(Boolean);
        res.json(lines);
    });
});

app.delete('/dashboard/logs', (req, res) => {
    fs.writeFile(LOGS_FILE, '', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'ok', message: 'Logs cleared' });
    });
});

app.post('/dashboard/config/routes', (req, res) => {
    try {
        const newRoute = req.body;
        if (!newRoute.id || !newRoute.match || !newRoute.primary) {
            return res.status(400).json({ error: 'Invalid route object' });
        }
        
        // Check for duplicate ID
        if (config.routes.some(r => r.id === newRoute.id)) {
            return res.status(409).json({ error: 'Route ID already exists' });
        }

        config.routes.push(newRoute);
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
        res.json({ status: 'ok', message: 'Route added', route: newRoute });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/dashboard/config/routes/:id', (req, res) => {
    try {
        const routeId = req.params.id;
        const initialLength = config.routes.length;
        
        config.routes = config.routes.filter(r => r.id !== routeId);
        
        if (config.routes.length === initialLength) {
            return res.status(404).json({ error: 'Route not found' });
        }

        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
        res.json({ status: 'ok', message: `Route ${routeId} deleted` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper: Proxy Request Logic
async function proxyRequest(targetUrlBase, req, route) {
    // Smartly join base and path to avoid double slashes
    const cleanBase = targetUrlBase.endsWith('/') ? targetUrlBase.slice(0, -1) : targetUrlBase;
    const cleanPath = req.path.startsWith('/') ? req.path : '/' + req.path;
    const targetUrl = cleanBase + cleanPath;

    console.log(`[Proxy Attempt] ${req.method} ${targetUrl}`);

    // Prepare headers
    const forwardHeaders = { ...req.headers };
    
    // Spoof headers to look like they come from the target itself
    const targetUrlObj = new URL(targetUrlBase);
    forwardHeaders['host'] = targetUrlObj.host;
    forwardHeaders['origin'] = targetUrlObj.origin;
    forwardHeaders['referer'] = targetUrlObj.href;
    
    // Standard Browser Headers
    forwardHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    if (!forwardHeaders['accept']) {
        forwardHeaders['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
    }

    // Clean Headers
    delete forwardHeaders['if-modified-since'];
    delete forwardHeaders['if-none-match'];
    delete forwardHeaders['accept-encoding'];
    delete forwardHeaders['sec-fetch-dest'];
    delete forwardHeaders['sec-fetch-mode'];
    delete forwardHeaders['sec-fetch-site'];
    delete forwardHeaders['sec-fetch-user'];
    delete forwardHeaders['upgrade-insecure-requests'];
    delete forwardHeaders['sec-ch-ua'];
    delete forwardHeaders['sec-ch-ua-mobile'];
    delete forwardHeaders['sec-ch-ua-platform'];
    delete forwardHeaders['priority'];

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers: forwardHeaders,
            data: req.body,
            params: req.query,
            validateStatus: () => true, // Pass through all status codes
            responseType: 'arraybuffer', // Buffer entire response
            timeout: route.failureConditions?.timeoutMs || 5000
        });
        return { success: true, response, targetUrl };
    } catch (err) {
        return { success: false, error: err, targetUrl };
    }
}

// Main Proxy Handler
app.all('*', async (req, res) => {
    // Skip dashboard routes
    if (req.path.startsWith('/dashboard')) return;

    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const route = matchRoute(req.method, req.path);

    let logEntry = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        requestPath: req.path,
        routeId: route ? route.id : 'unknown',
        backend: 'none',
        status: 0,
        latency: 0,
        error: false
    };

    if (!route) {
        res.status(404).json({ error: 'No matching route found' });
        logEntry.status = 404;
        logEntry.error = true;
        logRequest(logEntry);
        return;
    }

    // Decide initial strategy
    let useTest = config.experimentsEnabled;
    let finalResult = null;
    let triedBackend = 'none';

    if (useTest) {
        // Try Test Backend first (Accept 'test' or 'fallback' as the experimental backend)
        const testBackend = route.test || route.fallback;
        
        if (testBackend && testBackend.url) {
            triedBackend = 'test';
            const testResult = await proxyRequest(testBackend.url, req, route);
            
            // Define failure conditions (Status 5xx or Network Error)
            const failCodes = route.failureConditions?.statusCodes || [500, 502, 503, 504];
            const isFailure = !testResult.success || failCodes.includes(testResult.response?.status);

            if (isFailure) {
                console.warn(`[Proxy Fallback] Test backend failed (${testResult.success ? testResult.response.status : testResult.error.message}). Switching to Primary.`);
                // Fallback to Primary
                triedBackend = 'primary (fallback)';
                finalResult = await proxyRequest(route.primary.url, req, route);
            } else {
                finalResult = testResult;
            }
        } else {
            // No test backend configured, treat as safe mode
             triedBackend = 'primary';
             finalResult = await proxyRequest(route.primary.url, req, route);
        }
    } else {
        // Direct to Primary
        triedBackend = 'primary';
        finalResult = await proxyRequest(route.primary.url, req, route);
    }

    logEntry.backend = triedBackend;

    // USER REQUEST: Treat fallback as an error for Agent detection
    if (triedBackend.includes('fallback')) {
        logEntry.error = true;
    }

    if (finalResult.success) {
        const response = finalResult.response;
        // Forward Status
        res.status(response.status);
        // Forward Headers
        Object.keys(response.headers).forEach(key => {
            if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, response.headers[key]);
            }
        });
        // Cache Busting
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Send Data
        res.send(response.data);

        // Log Success
        logEntry.status = response.status;
        
        // Mark 5xx responses as errors for the Agent
        if (response.status >= 500) {
            logEntry.error = true;
        }

    } else {
        // Hard Failure (Network Error on both attempts)
        const err = finalResult.error;
        console.error(`[Proxy Error] ${err.message}`);
        res.status(502).send('Proxy Error: ' + err.message);
        
        logEntry.status = 502;
        logEntry.error = true;
        logEntry.errorMessage = err.message;
    }

    logEntry.latency = Date.now() - startTime;
    logRequest(logEntry);
});

// Start Server
app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`Proxy Server running on http://localhost:${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}/dashboard/config`);
    console.log(`-----------------------------------------------`);
});
