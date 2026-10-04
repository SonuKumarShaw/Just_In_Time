import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Star, Crown } from 'lucide-react';

function Pricing() {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('business');
    const [billingCycle, setBillingCycle] = useState('personal'); // personal or business

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            originalPrice: null,
            period: 'INR / month',
            description: 'Perfect to get started',
            icon: null,
            badge: null,
            buttonText: 'Get Started Free',
            buttonDisabled: false,
            trial: '1 month free trial',
            features: [
                'Get simple explanations',
                'Have short chats for common questions',
                'Try out image generation',
                'Save limited memory and context',
                'Basic route configuration',
                'Standard experiment features'
            ]
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 1999,
            originalPrice: null,
            period: 'INR / month (inclusive of GST)',
            description: 'For serious professionals',
            icon: Crown,
            badge: 'POPULAR',
            buttonText: 'Start Pro Trial',
            buttonDisabled: false,
            highlight: true,
            trial: '1 month free trial, then auto-payment',
            features: [
                'Solve complex problems',
                'Have long chats over multiple sessions',
                'Create more images, faster',
                'Remember goals and past conversations',
                'Unlimited route configurations',
                'Advanced experiment analytics',
                'Priority support',
                'Auto-payment after trial period'
            ]
        }
    ];

    const handleSelectPlan = async (planId) => {
        const username = localStorage.getItem('username');

        if (!username) {
            navigate('/login');
            return;
        }

        try {
            // Call backend API to create checkout session
            const response = await fetch('http://localhost:4000/api/checkout/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    planId,
                    username
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout');
            }

            if (planId === 'free') {
                // Free plan - show success message and redirect
                alert(`🎉 Welcome to Free Plan!\n\nYour 1-month free trial has started.\nYou can upgrade to Pro anytime.`);
                navigate('/dashboard');
            } else if (data.redirectToDashboard) {
                // Pro plan trial activation (temporary until Dodo products are created)
                alert(`🎉 Welcome to Pro Plan!\n\nYour 1-month free trial has started.\nAfter trial, payment of ₹1,999/month will be required.\n\nAuto-payment: Enabled`);
                localStorage.setItem('subscriptionPlan', 'pro');
                localStorage.setItem('subscriptionStatus', 'trial');
                navigate('/dashboard');
            } else {
                // Pro plan - redirect to Dodo checkout (when products are ready)
                window.location.href = data.checkoutUrl;
            }

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to process your request. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-text-secondary text-lg mb-2">
                        Start with 1 month free trial on any plan
                    </p>

                    {/* Toggle */}
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setBillingCycle('personal')}
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${billingCycle === 'personal'
                                ? 'bg-bg-card text-text-primary'
                                : 'bg-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setBillingCycle('business')}
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${billingCycle === 'business'
                                ? 'bg-bg-card text-text-primary'
                                : 'bg-transparent text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Business
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-bg-card border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl ${plan.highlight
                                ? 'border-indigo-500 bg-gradient-to-b from-indigo-900/20 to-bg-card'
                                : 'border-border-color hover:border-border-accent'
                                }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    {plan.icon && <plan.icon className="w-5 h-5 text-indigo-400" />}
                                    <h3 className="text-2xl font-bold text-text-primary">{plan.name}</h3>
                                </div>

                                {/* Price */}
                                <div className="my-4">
                                    {plan.originalPrice && (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-text-secondary line-through">
                                                ₹{plan.originalPrice}
                                            </span>
                                            <span className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                                                ₹{plan.price}
                                            </span>
                                        </div>
                                    )}
                                    {!plan.originalPrice && (
                                        <span className={`text-5xl font-bold ${plan.price === 0 ? 'text-text-primary' : 'bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent'
                                            }`}>
                                            ₹{plan.price.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    <p className="text-sm text-text-secondary mt-1">{plan.period}</p>
                                </div>

                                <p className="text-text-secondary text-sm">{plan.description}</p>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={plan.buttonDisabled}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 mb-6 ${plan.buttonDisabled
                                    ? 'bg-bg-secondary text-text-secondary cursor-not-allowed'
                                    : plan.highlight
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                        : 'bg-white text-bg-primary hover:bg-gray-100'
                                    }`}
                            >
                                {plan.buttonText}
                            </button>

                            {/* Features */}
                            <div className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-text-primary">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-12 text-text-secondary text-sm">
                    <p>All plans include a 30-day free trial. Cancel anytime during trial period with no charges.</p>
                </div>
            </div>
        </div>
    );
}

export default Pricing;
