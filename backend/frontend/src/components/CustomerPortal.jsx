import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, X } from 'lucide-react';

export default function CustomerPortal({ token }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const navigate = useNavigate();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          subject, body,
          form_id: 'a1b2c3d4-0007-0007-0007-000000000007',
          department_id: 'a1b2c3d4-0005-0005-0005-000000000005',
          sla_id: 'a1b2c3d4-0006-0006-0006-000000000006'
        })
      });
      setSubject(''); setBody('');
      setShowForm(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to submit ticket');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Support Request Terminal</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">Submit and track your technical incidents.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`tac-btn ${showForm ? 'tac-btn-ghost' : 'tac-btn-gold'}`}>
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="tac-panel p-6 mb-8 border-l-2 border-l-[#E6B239]">
          <h3 className="font-mono text-xs uppercase tracking-widest text-[#E6B239] mb-4">Initiate New Incident Report</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Subject / Incident Title" value={subject} onChange={e => setSubject(e.target.value)} className="tac-input" required />
            <textarea placeholder="Describe the technical issue in detail..." value={body} onChange={e => setBody(e.target.value)} className="tac-input min-h-[120px] resize-none" required></textarea>
            <div className="flex justify-end">
              <button type="submit" className="tac-btn tac-btn-crimson">Transmit Request</button>
            </div>
          </div>
        </form>
      )}

      <div className="tac-panel">
        <div className="tac-panel-header">
          <h2 className="font-mono text-xs uppercase tracking-widest text-gray-400">Active Tickets</h2>
        </div>
        <div className="divide-y divide-[#0a0a0a]">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-mono text-sm">SYNCING WITH SUPPORT...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-600 font-mono text-sm">NO INCIDENTS REPORTED</div>
          ) : (
            tickets.map(t => (
              <div key={t.id} onClick={() => navigate(`/ticket/${t.id}`)} className="p-5 hover:bg-[#8A0505]/5 cursor-pointer transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center group-hover:border-[#E6B239] transition-colors">
                    <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-[#E6B239]" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{t.subject}</div>
                    <div className="text-xs text-gray-600 mt-1 font-mono">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`tac-badge ${t.status === 'RESOLVED' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10'}`}>
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}