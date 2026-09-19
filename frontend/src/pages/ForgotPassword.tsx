import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="clay p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Forgot Password</h2>
        {message && <p className="text-green-600 mb-4 text-sm text-center bg-green-50 p-3 rounded-lg">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 clay-input text-sm focus:outline-none text-gray-700"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="clay-button clay-sm w-full text-blue-800 bg-blue-600 py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="flex justify-center gap-4 mt-6 text-sm">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">Agent Login</button>
          <button onClick={() => navigate('/portal/login')} className="text-green-600 hover:underline font-medium">User Login</button>
        </div>
      </div>
    </div>
  );
}
