import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Lock, AlertCircle, User } from 'lucide-react';

export default function TicketDetail({ token, callsign }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    setUserType(tokenPayload.type);

    const fetchTicket = async () => {
      const res = await fetch(`/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTicket(data);
    };
    fetchTicket();
  }, [id, token]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    const res = await fetch(`/api/tickets/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ body: reply, isInternal })
    });

    if (res.ok) {
      const newThread = await res.json();
      setTicket({ ...ticket, threads: [...ticket.threads, newThread] });
      setReply('');
      setIsInternal(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    await fetch(`/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    setTicket({ ...ticket, status: newStatus });
  };

  if (!ticket) return <div className="p-8 text-gray-500 font-mono text-sm">LOADING INTEL...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto grid grid-cols-3 gap-6 h-[calc(100vh-4rem)]">
      <div className="col-span-2 flex flex-col">
        <button onClick={() => navigate(userType === 'STAFF' ? '/dashboard' : '/portal')} className="text-gray-500 hover:text-[#E6B239] font-mono text-xs mb-4 flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> RETURN TO QUEUE
        </button>
        
        <div className="tac-panel p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <span className={`tac-badge ${ticket.status === 'ESCALATED' ? 'border-[#FF1F28] text-[#FF1F28] bg-[#FF1F28]/10' : ticket.status === 'RESOLVED' ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10'}`}>
              {ticket.status}
            </span>
          </div>
          <div className="flex space-x-6 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
            <span>ID: {ticket.id.substring(0,8)}</span>
            <span>FROM: {ticket.customer_name}</span>
            <span>SLA: PRIORITY ALPHA</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto tac-scroll space-y-4 pr-2">
          {ticket.threads.map((t) => (
            <div key={t.id} className={`p-4 border ${t.is_internal ? 'bg-[#8A0505]/10 border-[#8A0505]/30' : t.staff_callsign ? 'bg-[#0a0a0a]/60 border-[#1a1a1a]' : 'bg-black/40 border-[#1a1a1a]'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  {t.is_internal ? (
                    <Lock className="w-3.5 h-3.5 text-[#FF1F28]" />
                  ) : t.staff_callsign ? (
                    <User className="w-3.5 h-3.5 text-[#E6B239]" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="font-mono font-bold text-xs text-white">
                    {t.staff_callsign ? `[STAFF] ${t.staff_callsign}` : `[CIVILIAN] ${t.customer_name}`}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">{new Date(t.created_at).toLocaleTimeString()}</span>
              </div>
              <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{t.body}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleReply} className="tac-panel p-4 mt-4">
          <textarea 
            className="tac-input min-h-[80px] resize-none mb-3"
            placeholder={userType === 'STAFF' ? "ENTER TACTICAL RESPONSE..." : "REPLY TO SUPPORT..."}
            value={reply}
            onChange={e => setReply(e.target.value)}
          ></textarea>
          <div className="flex justify-between items-center">
            {userType === 'STAFF' ? (
              <label className="flex items-center text-[11px] font-mono uppercase tracking-wider text-gray-500 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="mr-2 accent-[#FF1F28]" />
                CLASSIFIED (Internal Note)
              </label>
            ) : (
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600">PUBLIC TRANSMISSION</span>
            )}
            <button type="submit" className="tac-btn tac-btn-crimson">
              TRANSMIT <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      <div className="col-span-1 space-y-4">
        <div className="tac-panel p-5">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-4 border-b border-[#1a1a1a] pb-3">Ticket Metadata</h3>
          <div className="space-y-4 text-sm font-mono">
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">STATUS</div>
              {userType === 'STAFF' ? (
                <select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value)} className="tac-input py-1.5 text-xs">
                  <option>OPEN</option>
                  <option>PENDING</option>
                  <option>ESCALATED</option>
                  <option>RESOLVED</option>
                </select>
              ) : (
                <div className="text-white text-xs uppercase">{ticket.status}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">PRIORITY</div>
              <div className="text-white text-xs uppercase">{ticket.priority}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">ASSIGNED OPERATOR</div>
              <div className="text-white text-xs">{ticket.agent_callsign || 'UNASSIGNED'}</div>
            </div>
          </div>
        </div>

        {ticket.sla_id && (
          <div className="tac-panel p-5 border-l-2 border-l-[#FF1F28]">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#FF1F28] mb-4 flex items-center border-b border-[#1a1a1a] pb-3">
              <AlertCircle className="w-3.5 h-3.5 mr-2" /> SLA TRACKING
            </h3>
            <div className="text-xs font-mono text-gray-300 space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">RESPONSE:</span> <span>00:15:00</span></div>
              <div className="flex justify-between"><span className="text-gray-600">RESOLUTION:</span> <span>01:00:00</span></div>
              <div className="flex justify-between pt-2 border-t border-[#1a1a1a] mt-2">
                <span className="text-[#FF1F28]">REMAINING:</span> <span className="text-[#FF1F28]">00:04:12</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}