import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Hardcoded authentication
        if (formData.username === 'XYZ' && formData.password === 'Abcd@1234') {
            try {
                // Register/get user in backend
                const response = await fetch('http://localhost:4000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        email: 'xyz@example.com'
                    })
                });

                if (response.ok) {
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('username', 'XYZ');
                    navigate('/pricing');
                } else {
                    setError('Failed to authenticate with server');
                }
            } catch (error) {
                console.error('Auth error:', error);
                setError('Server connection failed');
            }
        } else {
            setError('Invalid username or password');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
                        Just In Time
                    </h1>
                    <p className="text-text-secondary">Welcome back! Please login to continue.</p>
                </div>

                {/* Login Card */}
                <div className="bg-bg-secondary border-2 border-border-color rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg-card border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors duration-200 text-text-primary placeholder-text-secondary"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg-card border-2 border-border-color rounded-lg focus:border-indigo-500 focus:outline-none transition-colors duration-200 text-text-primary placeholder-text-secondary"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-indigo-500 hover:text-indigo-400 font-medium transition-colors">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
