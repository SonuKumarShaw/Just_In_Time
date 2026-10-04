const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, 'logs.jsonl');
const CONFIG_FILE = path.join(__dirname, 'req.config.json');

// Constants
const CHECK_INTERVAL_MS = 5000; // Run every 5 seconds
const ERROR_THRESHOLD_PERCENT = 40; // High threshold for demo (if > 50% errors)
const LOOKBACK_LINES = 20; // Only check last 20 requests

function runAgent() {
    console.log('[Agent] Checking logs...');

    if (!fs.existsSync(LOGS_FILE)) {
        console.log('[Agent] No logs file yet.');
        return;
    }

    // Read last part of file (simplified: read all, slice end)
    const data = fs.readFileSync(LOGS_FILE, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    
    if (lines.length === 0) return;

    // Get recent logs
    const recentLogs = lines.slice(-LOOKBACK_LINES).map(line => {
        try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);

    if (recentLogs.length === 0) return;

    // Calculate Stats
    const total = recentLogs.length;
    const errors = recentLogs.filter(l => l.error).length;
    const errorRate = (errors / total) * 100;

    console.log(`[Agent] Analyzed ${total} requests. Error Rate: ${errorRate.toFixed(1)}%`);

    // Decision Logic
    if (errorRate > ERROR_THRESHOLD_PERCENT) {
        console.log('[Agent] 🚨 Error rate TOO HIGH! Initiating Kill Switch...');
        
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            
            if (config.experimentsEnabled === true) {
                config.experimentsEnabled = false;
                fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
                console.log('[Agent] ✅ Kill Switch Activated: "experimentsEnabled" set to FALSE.');
            } else {
                console.log('[Agent] Experiments already disabled. No action.');
            }
        } catch (err) {
            console.error('[Agent] Failed to update config:', err);
        }
    } else {
        console.log('[Agent] System Healthy.');
    }
}

// Loop
setInterval(runAgent, CHECK_INTERVAL_MS);
console.log('🤖 AI Agent running... (Ctrl+C to stop)');
