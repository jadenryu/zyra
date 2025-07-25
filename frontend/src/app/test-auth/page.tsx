'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function TestAuthPage() {
  const { user, login, register, signOut } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpass123');
  const [fullName, setFullName] = useState('Test User');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    try {
      await login(email, password);
      setMessage('✅ Login successful!');
    } catch (error: any) {
      setMessage(`❌ Login failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage('');
    try {
      await register({ email, password, full_name: fullName });
      setMessage('✅ Registration successful!');
    } catch (error: any) {
      setMessage(`❌ Registration failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
        
        {user ? (
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-green-800">Logged in as:</h2>
            <p className="text-green-700">Email: {user.email}</p>
            <p className="text-green-700">Name: {user.full_name}</p>
            <button 
              onClick={signOut}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Register'}
              </button>
            </div>
          </div>
        )}
        
        {message && (
          <div className="p-4 bg-gray-100 rounded text-sm">
            {message}
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-600">
          <p>Test credentials:</p>
          <p>Email: newuser@example.com</p>
          <p>Password: testpass123</p>
        </div>
      </div>
    </div>
  );
}