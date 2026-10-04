# Just InTime - Resilient Proxy-based Testing Platform

## 🚀 The Reliability Revolution
**Just InTime** is not just a proxy; it is a comprehensive **Resilient Proxy-based Testing Platform**. Unlike traditional monitoring tools that only check if a server is online ("Is it 200 OK?"), Just InTime validates the entire stack in real-time.

We introduce a **Dual-Layer Reliability** approach:
1.  **Infrastructure Reliability**: Use our Intelligent Proxy to handle crashes, timeouts, and network failures instantly.
2.  **Business Logic Reliability**: Use our AI Automation Engine to verify that the running code actually meets human requirements.

---

## 🏗️ Architecture

The system operates on two parallel tracks to ensure 100% confidence in your deployment:

### Track 1: The "Hard" Checks (Infrastructure)
*   **Intelligent Proxy**: The gateway for all traffic. It intercepts requests and routes them to your primary backend.
*   **Auto-Fallback**: If the primary backend returns a 5xx error or times out, the proxy *instantly* reroutes traffic to a secondary or test environment. The user never sees the error.
*   **AI Watchdog (Agent)**: A background process that monitors error rates in real-time. If errors breach a threshold (e.g., >40%), it automatically triggers a "Kill Switch" to disable experimental features and restore system stability.

### Track 2: The "Soft" Checks (Business Logic)
*   **Automation Hub**: A dashboard where developers define "Requirements" in plain English.
*   **n8n Workflow Engine**: When requirements change, an automated workflow fetches the latest code fragments.
*   **GenAI Validator (Gemini)**: The AI reads the code and evaluates it against the human requirements.
*   **Result**: "PASS" or "FAIL" is reported back to the dashboard, ensuring that your code doesn't just run—it does what it's supposed to do.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TailwindCSS v4, Vite (Dashboard)
*   **Proxy Core**: Node.js, Express, Axios (Custom Proxy Logic)
*   **AI & Automation**: Google Gemini 1.5 Flash, n8n, Webhooks
*   **Microservices**: Node.js (Payment Service Example)

---

## 🚦 Key Features

### 1. Zero-Downtime Fallback
Never let a user see a 500 error again. Our proxy transparently retries requests on a backup server before the connection closes.

### 2. Autonomous "Kill Switch"
The "Self-Driving" aspect of the platform. The Agent watches logs so you don't have to. If things go wrong, it fixes the config automatically.

### 3. Logic-Aware Testing
Most proxies don't know *what* your app does. Just InTime connects to n8n to validate the *semantics* of your code, not just the status codes.

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+)
-   n8n (installed globally or via npx)
-   Google Gemini API Key

### Installation

1.  **Clone & Install**
    ```bash
    git clone <repo-url>
    cd ProxyServer
    npm install
    
    # Install Microservices
    cd "Just InTIme" && npm install
    cd ../req-backend && npm install
    cd ../payment_service && npm install
    ```

### Running the Platform

1.  **Start Proxy Core**: `node server.js`
2.  **Start AI Agent**: `node agent.js`
3.  **Start Dashboard**: `cd "Just InTIme" && npm run dev`
4.  **Start Automation Backend**: `cd req-backend && node server.js`
5.  **Start n8n**: `npx n8n start --tunnel`

---
## 👤 My Contribution

- Designed and implemented the **n8n-based automation workflows**
- Integrated Gemini API for semantic business logic validation
- Built the autonomous monitoring agent with kill-switch behavior
- Implemented proxy-level fallback handling and error analysis

## 📄 License
Built for innovation.
