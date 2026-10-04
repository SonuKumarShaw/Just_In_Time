import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, Code, Loader } from 'lucide-react';

function Requirements() {
    const [fragments, setFragments] = useState([]);
    const [selectedFragmentId, setSelectedFragmentId] = useState('');
    const [code, setCode] = useState('');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFragments();
    }, []);

    const fetchFragments = async () => {
        try {
            const res = await fetch('http://localhost:4002/fragments');
            if (res.ok) {
                const data = await res.json();
                setFragments(data.script_fragments || []);
            }
        } catch (err) {
            console.error('Failed to fetch fragments:', err);
            setError('Could not load code fragments. Ensure backend is running.');
        }
    };

    const handleFragmentChange = (e) => {
        const id = e.target.value;
        setSelectedFragmentId(id);
        const fragment = fragments.find(f => f.id.toString() === id);
        if (fragment) {
            setCode(fragment.code);
        } else {
            setCode('');
        }
    };

    const handleEvaluate = async () => {
        if (!code || !prompt) {
            setError('Please provide both code and a requirement prompt.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('http://localhost:4002/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, requirements: prompt })
            });

            if (!res.ok) {
                throw new Error('Verification failed');
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError('Evaluation failed. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">Requirement Evaluation</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Inputs */}
                <div className="space-y-6">
                    {/* Fragment Selector */}
                    <div className="bg-bg-card border-2 border-border-color rounded-xl p-5 shadow-sm">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Select Code Fragment
                        </label>
                        <select
                            value={selectedFragmentId}
                            onChange={handleFragmentChange}
                            className="w-full px-4 py-2 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary"
                        >
                            <option value="">-- Custom / Empty --</option>
                            {fragments.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            ))}
                        </select>
                        {fragments.length === 0 && !error && (
                            <p className="text-xs text-yellow-500 mt-2">Loading fragments...</p>
                        )}
                        {error && (
                            <p className="text-xs text-red-400 mt-2">{error}</p>
                        )}
                    </div>

                    {/* Code Editor */}
                    <div className="bg-bg-card border-2 border-border-color rounded-xl p-5 shadow-sm">
                        <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                            <Code className="w-4 h-4" /> Code to Evaluate
                        </label>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-64 px-4 py-3 bg-bg-primary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary font-mono text-sm resize-none"
                            placeholder="// Paste your code here..."
                        />
                    </div>

                    {/* Requirement Prompt */}
                    <div className="bg-bg-card border-2 border-border-color rounded-xl p-5 shadow-sm">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Requirement Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 px-4 py-3 bg-bg-secondary border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors text-text-primary placeholder-text-secondary resize-none"
                            placeholder="e.g. The code must update a global timeout variable and clear it on mousemove."
                        />
                    </div>

                     <button
                        onClick={handleEvaluate}
                        disabled={loading}
                        className={`w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {loading ? 'Evaluating...' : 'Evaluate Code'}
                    </button>
                </div>

                {/* Right Column: Results */}
                <div className="flex flex-col">
                    <div className={`h-full bg-bg-card border-2 ${result?.pass ? 'border-green-500/30' : result?.pass === false ? 'border-red-500/30' : 'border-border-color'} rounded-xl p-6 shadow-xl transition-all duration-500`}>
                         <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-color pb-2">
                            Evaluation Result
                        </h3>
                        
                        {result ? (
                            <div className="animate-slide-in space-y-4">
                                <div className={`flex items-center gap-3 p-4 rounded-lg ${result.pass ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {result.pass ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                                    <div>
                                        <h4 className="text-lg font-bold">{result.pass ? 'Requirement Met' : 'Requirement Not Met'}</h4>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Reasoning</span>
                                    <p className="text-text-primary leading-relaxed bg-bg-secondary p-4 rounded-lg border border-border-color">
                                        {result.reason}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-text-secondary opacity-50">
                                <Send className="w-12 h-12 mb-4" />
                                <p>Ready to evaluate.</p>
                                <p className="text-sm">Select a fragment, enter requirements, and click Evaluate.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Requirements;
