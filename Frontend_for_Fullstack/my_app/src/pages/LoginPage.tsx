import React, { useState } from 'react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AuthResponse, RegResponse, User } from '../types';
import { jwtDecode } from 'jwt-decode';
import { Seo } from '../components/Seo';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post<AuthResponse>('/api/v1/login', {
          email: formData.email,
          password: formData.password
        });
        
        // Decode JWT to get user info
        try {
          const decoded: any = jwtDecode(data.access_token);
          const userRole = decoded.role?.toLowerCase?.() || 'guest';
          const userId = String(decoded.id || decoded.user_id);
          const username = decoded.username || formData.email.split('@')[0];
          const email = decoded.email || formData.email;
          
          login(
            data.access_token,
            data.refresh_token,
            userId,
            userRole,
            username,
            email
          );
          navigate('/home');
        } catch (decodeError) {
          // Fallback: fetch user profile if token decode fails
          try {
            const userResponse = await api.get<User>(`/api/v1/profile`);
            const user = userResponse.data;
            const userRole = (user.role as any)?.toLowerCase?.() || 'guest';
            login(
              data.access_token,
              data.refresh_token,
              String(user.user_id),
              userRole,
              user.username,
              user.email
            );
            navigate('/home');
          } catch {
            login(data.access_token, data.refresh_token, '', 'guest', formData.email, formData.email);
            navigate('/home');
          }
        }
      } else {
        await api.post<RegResponse>('/api/v1/reg', formData);
        setError('');
        alert('Registration successful! Please login.');
        setIsLogin(true);
        setFormData({ email: '', password: '', username: '' });
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.detail || 'Error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition";
  const buttonClasses = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <Seo
        title={isLogin ? 'Sign in' : 'Create account'}
        description="Sign in to Interview Pro to manage templates, launch AI interviews and review your preparation progress."
        canonicalPath="/login"
        noIndex
      />
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Pro</h1>
          <p className="text-gray-600">Master your interview skills</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            {isLogin ? '👋 Welcome Back' : '📝 Create Account'}
          </h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                id="email"
                type="email"
                required
                className={inputClasses}
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                autoComplete="email"
              />
            </div>
            
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input 
                  id="username"
                  type="text"
                  required
                  className={inputClasses}
                  placeholder="Choose a username" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  autoComplete="username"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                id="password"
                type="password" 
                required
                className={inputClasses}
                placeholder="••••••••" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                autoComplete="current-password"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className={buttonClasses}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span>
                  Processing...
                </span>
              ) : (
                isLogin ? '🚀 Sign In' : '✨ Create Account'
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-indigo-600 hover:text-indigo-700 underline font-semibold transition"
            >
              {isLogin ? 'Sign up here' : 'Sign in here'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          This is a demo. Use test credentials to explore the app.
        </p>
      </div>
    </div>
  );
};
