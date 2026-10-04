import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Plus, Trash2, Settings, FileText, ClipboardCheck, Bot } from 'lucide-react';
import Logs from './Logs';
import Requirements from './Requirements';

function Dashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'User';
    const [activeTab, setActiveTab] = useState('config'); // 'config', 'logs', or 'requirements'

    const [config, setConfig] = useState({
        experimentsEnabled: false,
        globalThresholds: {
            errorRatePercent: 5,
            windowSeconds: 60
        },
        routes: []
    });

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:3000/dashboard/config');
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (err) {
            console.error('Failed to fetch config', err);
        }
    };

    useEffect(() => {
        fetchConfig();
        const interval = setInterval(fetchConfig, 5000);
        return () => clearInterval(interval);
    }, []);

    // Payment Verification Logic
    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');

            if (sessionId) {
                try {
                    showNotification('Verifying payment...', 'info');
                    const res = await fetch('http://localhost:4000/api/checkout/verify-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId,
                            username
                        })
                    });
                    
                    const data = await res.json();
                    
                    if (data.success) {
                        showNotification('Payment Successful! Subscription Active.', 'success');
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                         showNotification(`Payment status: ${data.status}. Please check back.`, 'info');
                    }
                } catch (error) {
                    console.error('Verification failed', error);
                    showNotification('Failed to verify payment.', 'error');
                }
            }
        };

        verifyPayment();
    }, [username]);

    // Form state
    const [currentRoute, setCurrentRoute] = useState({
        id: '',
        method: 'GET',
        path: '/',
        primaryUrl: '',
        fallbackUrl: '',
        primaryTraffic: 50,
        fallbackTraffic: 50,
        timeoutMs: 30000,
        statusCodes: '500, 502, 503, 504',
        enabled: false
    });

    const toggleExperiments = async () => {
        try {
            const newState = !config.experimentsEnabled;
            setConfig(prev => ({ ...prev, experimentsEnabled: newState }));
            
            const res = await fetch('http://localhost:3000/dashboard/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ experimentsEnabled: newState })
            });
            
            if (!res.ok) {
                setConfig(prev => ({ ...prev, experimentsEnabled: !newState }));
                showNotification('Failed to toggle agent', 'error');
            } else {
                showNotification(`AI Agent ${newState ? 'Enabled' : 'Disabled'}`, 'success');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error toggling agent', 'error');
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentRoute(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTrafficChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        setCurrentRoute(prev => ({
            ...prev,
            primaryTraffic: value,
            fallbackTraffic: 100 - value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const newRoute = {
            id: currentRoute.id || `route-${Date.now()}`,
            match: {
                method: currentRoute.method,
                path: currentRoute.path
            },
            experiment: {
                enabled: currentRoute.enabled,
                trafficSplit: {
                    primary: currentRoute.primaryTraffic,
                    fallback: currentRoute.fallbackTraffic
                }
            },
            primary: {
                url: currentRoute.primaryUrl
            },
            fallback: {
                url: currentRoute.fallbackUrl
            },
            failureConditions: {
                statusCodes: currentRoute.statusCodes.split(',').map(code => parseInt(code.trim())),
                timeoutMs: parseInt(currentRoute.timeoutMs)
            }
        };

        try {
            const res = await fetch('http://localhost:3000/dashboard/config/routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoute)
            });

            if (res.ok) {
                fetchConfig();
                setCurrentRoute({
                    id: '',
                    method: 'GET',
                    path: '/',
                    primaryUrl: '',
                    fallbackUrl: '',
                    primaryTraffic: 50,
                    fallbackTraffic: 50,
                    timeoutMs: 30000,
                    statusCodes: '500, 502, 503, 504',
                    enabled: false
                });
                showNotification('Route added successfully!', 'success');
            } else {
                const err = await res.json();
                showNotification(err.error || 'Failed to add route', 'error');
            }
        } catch (err) {
            showNotification('Error adding route', 'error');
        }
    };

    const handleDeleteRoute = async (routeId) => {
        if (!confirm('Are you sure you want to delete this route?')) return;
        try {
            const res = await fetch(`http://localhost:3000/dashboard/config/routes/${routeId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchConfig();
                showNotification('Route deleted', 'info');
            } else {
                showNotification('Failed to delete route', 'error');
            }
        } catch (err) {
            showNotification('Error deleting route', 'error');
        }
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;
        const bgColor = type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
            type === 'info' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
            font-weight: 600;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'fadeIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-bg-primary p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header with Logout */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            Just In Time
                        </h1>
                        <p className="text-text-secondary text-sm mt-1">Welcome back, {username}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-bg-card border-2 border-border-color hover:border-red-500 text-text-primary rounded-lg transition-all duration-200 hover:text-red-400"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* Dashboard Container */}
                <div className="bg-bg-secondary border-2 border-border-color rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-in">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-border-color">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${activeTab === 'config'
                                ? 'text-indigo-400 border-b-2 border-indigo-500'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <Settings className="w-5 h-5" />
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${activeTab === 'logs'
                                ? 'text-indigo-400 border-b-2 border-indigo-500'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('requirements')}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${activeTab === 'requirements'
                                ? 'text-indigo-400 border-b-2 border-indigo-500'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <ClipboardCheck className="w-5 h-5" />
                            Requirements
                        </button>
                        <button
                            onClick={() => setActiveTab('automation')}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${activeTab === 'automation'
                                ? 'text-indigo-400 border-b-2 border-indigo-500'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <Bot className="w-5 h-5" />
                            Automation
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'config' ? (
                        <ConfigurationTab
                            config={config}
                            currentRoute={currentRoute}
                            toggleExperiments={toggleExperiments}
                            handleFormChange={handleFormChange}
                            handleTrafficChange={handleTrafficChange}
                            handleFormSubmit={handleFormSubmit}
                            handleDeleteRoute={handleDeleteRoute}
                        />
                    ) : activeTab === 'logs' ? (
                        <Logs />
                    ) : activeTab === 'requirements' ? (
                        <Requirements />
                    ) : (
                        <AutomationTab showNotification={showNotification} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ConfigurationTab({
    config,
    currentRoute,
    toggleExperiments,
    handleFormChange,
    handleTrafficChange,
    handleFormSubmit,
    handleDeleteRoute
}) {
    return (
        <>
            {/* Dashboard Header with Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border-color mb-6">
                <h2 className="text-2xl font-semibold text-text-primary">Route Configuration</h2>

                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-secondary">Global Experiments</span>
                    <button
                        onClick={toggleExperiments}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-bg-secondary ${config.experimentsEnabled
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30'
                            : 'bg-border-accent border-2 border-border-color'
                            }`}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${config.experimentsEnabled ? 'translate-x-7' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Add Route Form */}
            <form onSubmit={handleFormSubmit} className="mb-8 p-6 bg-bg-card border-2 border-border-color rounded-xl">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Add New Route</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Route ID */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Route ID (optional)
                        </label>
                        <input
                            type="text"
                            name="id"
                            value={currentRoute.id}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                            placeholder="search-canary"
                        />
                    </div>

                    {/* HTTP Method */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            HTTP Method
                        </label>
                        <select
                            name="method"
                            value={currentRoute.method}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary"
                            required
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>

                    {/* Path */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Path *
                        </label>
                        <input
                            type="text"
                            name="path"
                            value={currentRoute.path}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                            placeholder="/api/search"
                            required
                        />
                    </div>

                    {/* Primary URL */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Primary URL *
                        </label>
                        <input
                            type="url"
                            name="primaryUrl"
                            value={currentRoute.primaryUrl}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                            placeholder="https://api.company.com"
                            required
                        />
                    </div>

                    {/* Fallback URL */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Fallback URL *
                        </label>
                        <input
                            type="url"
                            name="fallbackUrl"
                            value={currentRoute.fallbackUrl}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                            placeholder="https://fallback.company.com"
                            required
                        />
                    </div>

                    {/* Timeout */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Timeout (ms)
                        </label>
                        <input
                            type="number"
                            name="timeoutMs"
                            value={currentRoute.timeoutMs}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary"
                            min="100"
                            required
                        />
                    </div>

                    {/* Status Codes */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Failure Status Codes (comma separated)
                        </label>
                        <input
                            type="text"
                            name="statusCodes"
                            value={currentRoute.statusCodes}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                            placeholder="500, 502, 503, 504"
                            required
                        />
                    </div>

                    {/* Enable Experiment */}
                    <div className="md:col-span-2 flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="enabled"
                            id="enabled"
                            checked={currentRoute.enabled}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-indigo-600 bg-bg-secondary border-border-color rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="enabled" className="text-sm font-medium text-text-primary">
                            Enable experiment for this route
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Route
                </button>
            </form>

            {/* Routes List */}
            {config.routes.length > 0 && (
                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Configured Routes</h3>
                    {config.routes.map((route, index) => (
                        <RouteCard key={route.id} route={route} index={index} onDelete={handleDeleteRoute} />
                    ))}
                </div>
            )}

            {config.routes.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                    <p className="text-lg">No routes configured yet.</p>
                    <p className="text-sm mt-2">Use the form above to add your first route configuration.</p>
                </div>
            )}


        </>
    );
}

function RouteCard({ route, index, onDelete }) {
    const formatRouteTitle = (id) => {
        if (!id) return 'Unnamed Route';
        if (id.includes('-')) {
            return id.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        return id.charAt(0).toUpperCase() + id.slice(1);
    };

    const experimentEnabled = route.experiment?.enabled ?? false;
    const trafficSplit = route.experiment?.trafficSplit || { primary: 50, fallback: 50 };
    const fallbackUrl = route.fallback?.url || route.test?.url || 'N/A';

    return (
        <div
            className="bg-bg-card border-2 border-border-color rounded-xl p-5 hover:border-border-accent hover:shadow-2xl transition-all duration-300 animate-slide-in"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-text-primary">
                    {formatRouteTitle(route.id)}
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${experimentEnabled
                            ? 'bg-green-500/20 text-green-400 border border-green-500'
                            : 'bg-red-500/20 text-red-400 border border-red-500'
                            }`}
                    >
                        {experimentEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                        onClick={() => onDelete(route.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete route"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="text-text-secondary">Method:</span>
                    <code className="ml-2 bg-bg-primary border border-border-color px-2 py-1 rounded text-indigo-400 text-xs font-mono">
                        {route.match?.method}
                    </code>
                </div>
                <div>
                    <span className="text-text-secondary">Path:</span>
                    <code className="ml-2 bg-bg-primary border border-border-color px-2 py-1 rounded text-indigo-400 text-xs font-mono">
                        {route.match?.path}
                    </code>
                </div>
                <div className="md:col-span-2">
                    <span className="text-text-secondary">Primary:</span>
                    <code className="ml-2 bg-bg-primary border border-border-color px-2 py-1 rounded text-text-primary text-xs font-mono break-all">
                        {route.primary?.url}
                    </code>
                </div>
                <div className="md:col-span-2">
                    <span className="text-text-secondary">Fallback:</span>
                    <code className="ml-2 bg-bg-primary border border-border-color px-2 py-1 rounded text-text-primary text-xs font-mono break-all">
                        {fallbackUrl}
                    </code>
                </div>
                <div>
                    <span className="text-text-secondary">Traffic:</span>
                    <span className="ml-2 text-indigo-400 font-semibold">
                        {trafficSplit.primary}% / {trafficSplit.fallback}%
                    </span>
                </div>
                <div>
                    <span className="text-text-secondary">Timeout:</span>
                    <code className="ml-2 bg-bg-primary border border-border-color px-2 py-1 rounded text-indigo-400 text-xs font-mono">
                        {route.failureConditions?.timeoutMs}ms
                    </code>
                </div>
            </div>
        </div>
    );
}



function AutomationTab({ showNotification }) {

    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        fetchPrompt();
        fetchResult();
    }, []);

    const fetchPrompt = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:4002/prompt');
            if (res.ok) {
                const data = await res.json();
                setPrompt(data.prompt);
            } else {
                 showNotification('Failed to load prompt', 'error');
            }
        } catch (err) {
            console.error(err);
             showNotification('Error loading prompt', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchResult = async () => {
        try {
            const res = await fetch('http://localhost:4002/result');
            if (res.ok) {
                 const data = await res.json();
                 setResult(data.result);
            }
        } catch (err) {
             console.error('Error loading result:', err);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:4002/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (res.ok) {
                showNotification('Prompt saved successfully!', 'success');
            } else {
                showNotification('Failed to save prompt', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Error saving prompt', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-text-primary">Automation Prompt</h2>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Prompt'}
                </button>
            </div>
            <div className="bg-bg-card border-2 border-border-color rounded-xl p-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Prompt Requirements
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-96 p-4 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary font-mono text-sm resize-none"
                    placeholder="Enter keywords or requirements for automation..."
                />
                 <p className="text-xs text-text-secondary mt-2">
                    This prompt will be saved to the server and used for automation tasks.
                </p>
            </div>

            {/* Evaluation Result Section */}
            <div className="bg-bg-card border-2 border-border-color rounded-xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Evaluation Result</h3>
                <div className="bg-bg-primary rounded-lg p-4 border border-border-color font-mono text-sm text-text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {renderResult(result)}
                </div>
            </div>
        </div>
    );
}

const renderResult = (resultData) => {
    if (!resultData) return 'No results available yet.';

    let parsed = null;
    let rawText = resultData;

    try {
        // Cleaning potential markdown blocks
        const cleaned = resultData.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
    } catch (e) {
        // Fallback to raw text if parsing fails
        return rawText;
    }

    if (parsed && typeof parsed.pass === 'boolean') {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-text-primary font-bold">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${parsed.pass
                        ? 'bg-green-500/20 text-green-400 border border-green-500'
                        : 'bg-red-500/20 text-red-400 border border-red-500'
                        }`}>
                        {parsed.pass ? 'PASS' : 'FAIL'}
                    </span>
                </div>
                <div>
                    <span className="text-text-primary font-bold">Reason:</span>
                    <p className="mt-1 text-text-secondary">{parsed.reason}</p>
                </div>
            </div>
        );
    }

    return rawText;
};


export default Dashboard;
