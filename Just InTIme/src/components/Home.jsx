import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, BarChart3, Globe } from 'lucide-react';

function Home() {
    const features = [
        {
            icon: Shield,
            title: 'Secure Routing',
            description: 'Enterprise-grade security with advanced failure detection and automatic fallback mechanisms.'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Optimized traffic splitting ensures minimal latency and maximum performance for your APIs.'
        },
        {
            icon: BarChart3,
            title: 'Real-time Analytics',
            description: 'Monitor experiment performance with detailed metrics and error rate tracking.'
        },
        {
            icon: Globe,
            title: 'Global Scale',
            description: 'Deploy experiments across multiple regions with intelligent traffic management.'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
            {/* Navigation */}
            <nav className="border-b border-border-color backdrop-blur-sm bg-bg-secondary/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">JIT</span>
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                Just In Time
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-white hover:text-indigo-400 transition-colors duration-200 font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center animate-fade-in">
                    <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            A/B Testing & Traffic Management
                        </span>
                        <br />
                        <span className="text-text-primary">Made Simple</span>
                    </h2>
                    <p className="text-xl text-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
                        Deploy, monitor, and manage API experiments with confidence.
                        Split traffic intelligently between primary and fallback endpoints with real-time failure detection.
                    </p>
                    <div className="flex justify-center items-center">
                        <Link
                            to="/login"
                            className="group px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl hover:shadow-indigo-500/50 transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2"
                        >
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                        Powerful Features for Modern APIs
                    </h3>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        Everything you need to run successful experiments and ensure API reliability
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-bg-secondary border-2 border-border-color rounded-2xl p-6 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transform hover:-translate-y-2 transition-all duration-300 animate-slide-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h4>
                            <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 text-center shadow-2xl">
                    <h3 className="text-4xl font-bold text-white mb-4">
                        Ready to Transform Your API Strategy?
                    </h3>
                    <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of developers who trust Just In Time for their experiment management
                    </p>
                    <Link
                        to="/login"
                        className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                    >
                        Get Started Now - It's Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border-color mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-text-secondary text-sm">
                        © 2024 Just In Time. All rights reserved. Built with React & TailwindCSS.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
