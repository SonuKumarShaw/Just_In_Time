import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Trash2 } from 'lucide-react';

function Logs() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://localhost:3000/dashboard/logs');
            if (res.ok) {
                const data = await res.json();
                const formattedLogs = data.map(l => ({
                    id: l.requestId,
                    timestamp: l.timestamp,
                    level: l.error || l.status >= 500 ? 'error' : (l.status >= 400 ? 'warning' : 'success'),
                    route: l.requestPath,
                    method: l.method || 'N/A',
                    status: l.status,
                    message: l.errorMessage || `Proxied to ${l.backend}`,
                    responseTime: l.latency + 'ms'
                })).reverse(); // Newest first
                setLogs(formattedLogs);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear all logs?')) return;
        try {
            await fetch('http://localhost:3000/dashboard/logs', { method: 'DELETE' });
            fetchLogs();
        } catch (err) {
            console.error('Failed to clear logs', err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = logs;

        // Filter by level
        if (filterLevel !== 'all') {
            filtered = filtered.filter(log => log.level === filterLevel);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.method.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
    }, [searchTerm, filterLevel, logs]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'success':
                return 'bg-green-500/20 text-green-400 border-green-500';
            case 'info':
                return 'bg-blue-500/20 text-blue-400 border-blue-500';
            case 'warning':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
            case 'error':
                return 'bg-red-500/20 text-red-400 border-red-500';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500';
        }
    };

    const getStatusColor = (status) => {
        if (status >= 200 && status < 300) return 'text-green-400';
        if (status >= 300 && status < 400) return 'text-blue-400';
        if (status >= 400 && status < 500) return 'text-yellow-400';
        if (status >= 500) return 'text-red-400';
        return 'text-text-secondary';
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleExportLogs = () => {
        const dataStr = JSON.stringify(filteredLogs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString()}.json`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        System Logs
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-card border-2 border-border-color hover:border-red-500 text-text-primary rounded-lg transition-all duration-200 hover:text-red-400"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Logs
                </button>
                <button
                    onClick={handleExportLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-card border-2 border-border-color hover:border-indigo-500 text-text-primary rounded-lg transition-all duration-200"
                >
                    <Download className="w-4 h-4" />
                    Export Logs
                </button>
            </div>

            {/* Filters */}
            <div className="bg-bg-card border-2 border-border-color rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary"
                        />
                    </div>

                    {/* Filter by Level */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary"
                        >
                            <option value="all">All Levels</option>
                            <option value="success">Success</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-16 text-text-secondary">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No logs found</p>
                        <p className="text-sm mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-bg-card border-2 border-border-color rounded-lg p-4 hover:border-border-accent transition-all duration-200"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${getLevelColor(log.level)}`}>
                                            {log.level}
                                        </span>
                                        <code className="bg-bg-primary border border-border-color px-2 py-1 rounded text-indigo-400 text-xs font-mono">
                                            {log.method}
                                        </code>
                                        <code className="bg-bg-primary border border-border-color px-2 py-1 rounded text-text-primary text-xs font-mono">
                                            {log.route}
                                        </code>
                                        <span className={`font-mono text-sm font-semibold ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <p className="text-text-primary">{log.message}</p>
                                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                                        <span>{formatTimestamp(log.timestamp)}</span>
                                        <span>•</span>
                                        <span>Response time: {log.responseTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Logs;
