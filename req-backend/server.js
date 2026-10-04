/* =========================
   LOAD ENV (MUST BE FIRST)
========================= */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/* =========================
   DEBUG ENV
========================= */
console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'FOUND' : 'NOT FOUND');

process.on('exit', (code) => {
    console.log(`[DEBUG] Process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('[DEBUG] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[DEBUG] Unhandled Rejection at:', promise, 'reason:', reason);
});

/* =========================
   APP SETUP
========================= */
const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors({ origin: true }));
app.use(bodyParser.json());

/* =========================
   LOAD FRAGMENTS
========================= */
const FRAGMENTS_FILE = path.join(__dirname, 'script-fragments.json');
let fragmentsData = { script_fragments: [] };

try {
    const data = fs.readFileSync(FRAGMENTS_FILE, 'utf8');
    fragmentsData = JSON.parse(data);
    console.log(`[ReqBackend] Loaded ${fragmentsData.script_fragments.length} fragments.`);
} catch (err) {
    console.error('[ReqBackend] Failed to load script-fragments.json:', err.message);
}

/* =========================
   ROUTES
========================= */

app.get('/fragments', (req, res) => {
    res.json(fragmentsData);
});

/* =========================
   PROMPT ENDPOINTS
========================= */
const PROMPT_FILE = path.join(__dirname, 'prompt.txt');

app.get('/prompt', (req, res) => {
    try {
        if (!fs.existsSync(PROMPT_FILE)) {
             fs.writeFileSync(PROMPT_FILE, '', 'utf8');
        }
        const data = fs.readFileSync(PROMPT_FILE, 'utf8');
        res.json({ prompt: data });
    } catch (err) {
        console.error('[ReqBackend] Failed to read prompt.txt:', err.message);
        res.status(500).json({ error: 'Failed to read prompt' });
    }
});

app.post('/prompt', async (req, res) => {
    const { prompt } = req.body;
    if (prompt === undefined) {
        return res.status(400).json({ error: 'Missing "prompt" in payload' });
    }
    try {
        fs.writeFileSync(PROMPT_FILE, prompt, 'utf8');
        console.log('[ReqBackend] Updated prompt.txt');
        
        // Trigger n8n Webhook
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl) {
            console.log(`[ReqBackend] Triggering n8n webhook: ${webhookUrl}`);
            // Fire and forget - don't wait for n8n to finish
            axios.post(webhookUrl, { 
                event: 'prompt_updated',
                timestamp: new Date().toISOString()
            }).catch(err => {
                console.error('[ReqBackend] Failed to trigger n8n webhook:', err.message);
            });
        }

        res.json({ success: true, triggeredWebhook: !!webhookUrl });
    } catch (err) {
        console.error('[ReqBackend] Failed to write prompt.txt:', err.message);
        res.status(500).json({ error: 'Failed to save prompt' });
    }
});

/* =========================
   RESULT ENDPOINTS
========================= */
const RESULT_FILE = path.join(__dirname, 'result.txt');

app.get('/result', (req, res) => {
    try {
        if (!fs.existsSync(RESULT_FILE)) {
             fs.writeFileSync(RESULT_FILE, 'No results yet.', 'utf8');
        }
        const data = fs.readFileSync(RESULT_FILE, 'utf8');
        res.json({ result: data });
    } catch (err) {
        console.error('[ReqBackend] Failed to read result.txt:', err.message);
        res.status(500).json({ error: 'Failed to read result' });
    }
});

app.post('/result', (req, res) => {
    const { result } = req.body;
    if (result === undefined) {
        return res.status(400).json({ error: 'Missing "result" in payload' });
    }
    try {
        fs.writeFileSync(RESULT_FILE, result, 'utf8');
        console.log('[ReqBackend] Updated result.txt');
        res.json({ success: true });
    } catch (err) {
        console.error('[ReqBackend] Failed to write result.txt:', err.message);
        res.status(500).json({ error: 'Failed to save result' });
    }
});

app.post('/evaluate', async (req, res) => {
    const { code, requirements } = req.body;

    if (!code || !requirements) {
        return res.status(400).json({
            error: 'Missing "code" or "requirements" in payload'
        });
    }

    console.log(`[ReqBackend] Evaluating: "${requirements.substring(0, 60)}..."`);

    try {
        const result = await callGeminiModel(code, requirements);
        res.json(result);
    } catch (err) {
        console.error('[ReqBackend] Evaluation failed:', err.message);
        res.status(500).json({
            error: 'Evaluation failed',
            details: err.message
        });
    }
});

/* =========================
   GEMINI MODEL CALL
========================= */
async function callGeminiModel(code, requirements) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('[ReqBackend] GEMINI_API_KEY missing. Using Mock Logic.');
        return mockLogic(code, requirements);
    }

    console.log('[ReqBackend] Calling Gemini (gemini-1.5-flash)...');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash-lite", // Updated as requested
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are a strict code compliance checker.
        Verify whether the provided Code satisfies the Requirement.
        
        Requirement:
        ${requirements}
        
        Code:
        ${code}

        Respond ONLY with a valid JSON object in this format:
        { "pass": boolean, "reason": "string" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('[ReqBackend] Gemini RAW response:', text);

        try {
            return JSON.parse(text);
        } catch (parseErr) {
            console.error("Failed to parse JSON from Gemini:", text);
            return { pass: false, reason: "Gemini returned invalid JSON." };
        }

    } catch (err) {
        console.error('[ReqBackend] Gemini API Error:', err.message);
        throw err;
    }
}

/* =========================
   MOCK FALLBACK
========================= */
function mockLogic(code, requirements) {
    const keywords = requirements
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 3);

    const codeLower = code.toLowerCase();
    const hits = keywords.filter(w => codeLower.includes(w));
    const pass = hits.length >= Math.ceil(keywords.length * 0.5);

    return {
        pass,
        reason: pass
            ? 'Code contains sufficient matching concepts.'
            : `Only ${hits.length}/${keywords.length} requirement keywords found. Add GEMINI_API_KEY to use real model.`
    };
}

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`✅ Requirement Evaluation Backend running on http://localhost:${PORT}`);
});
