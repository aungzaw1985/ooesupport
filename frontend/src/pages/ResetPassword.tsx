import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="clay p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Link</h2>
          <p className="text-gray-600 mb-6">No reset token found. Please request a new reset link.</p>
          <button onClick={() => navigate('/forgot-password')} className="clay-button clay-sm text-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium">Request Reset Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="clay p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Reset Password</h2>
        {message && <p className="text-green-600 mb-4 text-sm text-center bg-green-50 p-3 rounded-lg">{message}</p>}
        {error && <p className="text-red-500 mb-4 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 clay-input text-sm focus:outline-none text-gray-700"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 clay-input text-sm focus:outline-none text-gray-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
