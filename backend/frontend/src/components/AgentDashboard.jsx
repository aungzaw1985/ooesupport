import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ArrowUpDown, Inbox, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AgentDashboard({ token }) {
  const [activeQueue, setActiveQueue] = useState('OPEN');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tickets?status=${activeQueue}`, {
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
    fetchTickets();
  }, [activeQueue, token]);

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const queues = [
    { key: 'OPEN', label: 'Open', icon: Inbox, color: 'text-[#E6B239]', count: 12 },
    { key: 'PENDING', label: 'Pending', icon: Clock, color: 'text-blue-400', count: 4 },
    { key: 'ESCALATED', label: 'Escalated', icon: AlertTriangle, color: 'text-[#FF1F28]', count: 2 },
    { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle, color: 'text-green-500', count: 45 },
  ];

  const getPriorityClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'emergency': case 'high':
        return 'border-[#FF1F28] text-[#FF1F28] bg-[#FF1F28]/10';
      case 'normal':
        return 'border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10';
      default:
        return 'border-gray-600 text-gray-600 bg-gray-600/10';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'ESCALATED':
        return 'border-[#FF1F28] text-[#FF1F28] bg-[#FF1F28]/10';
      case 'RESOLVED':
        return 'border-green-500 text-green-500 bg-green-500/10';
      case 'PENDING':
        return 'border-blue-400 text-blue-400 bg-blue-400/10';
      default:
        return 'border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Tickets</h1>
            <p className="text-xs text-gray-500 font-mono mt-1 tracking-wide">TACTICAL OPERATIONS QUEUE / {activeQueue}</p>
          </div>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="Search ticket or civilian..." 
                className="tac-input pl-9 pr-4 py-2.5 text-xs w-full sm:w-72"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="tac-btn tac-btn-gold whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" /> New Ticket
            </button>
          </div>
        </div>

        {/* Queue Tabs */}
        <div className="flex border-b border-[#1f1f23] mb-6 overflow-x-auto tac-scroll">
          {queues.map(q => (
            <button
              key={q.key}
              onClick={() => setActiveQueue(q.key)}
              className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${activeQueue === q.key ? 'text-white border-[#E6B239]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              {q.label} <span className="ml-2 text-[10px] bg-[#1a1a1d] px-1.5 py-0.5 text-gray-400 rounded-sm">{q.count}</span>
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="tac-panel rounded-sm overflow-hidden">
          <div className="overflow-x-auto tac-scroll">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f23]">
                  <th className="tac-table-header w-40">
                    <div className="flex items-center">
                      Ticket <ArrowUpDown className="w-3 h-3 ml-1 text-gray-700" />
                    </div>
                  </th>
                  <th className="tac-table-header w-40">Last Updated</th>
                  <th className="tac-table-header min-w-[300px]">Subject</th>
                  <th className="tac-table-header w-48">From</th>
                  <th className="tac-table-header w-32">Priority</th>
                  <th className="tac-table-header w-48">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-16 text-gray-500 font-mono text-sm">SYNCING WITH COMMAND...</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-16 text-gray-600 font-mono text-sm">NO TICKETS FOUND IN QUEUE</td></tr>
                ) : (
                  filteredTickets.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => navigate(`/ticket/${t.id}`)} 
                      className="border-b border-[#161618] hover:bg-[#161618] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-[#E6B239] uppercase">
                          #{t.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-gray-500">
                          {new Date(t.updated_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                        </div>
                        <div className="font-mono text-[10px] text-gray-700 mt-1">
                          {new Date(t.updated_at || t.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white font-medium">
                          {t.subject}
                        </div>
                        <div className="mt-1">
                          <span className={`tac-badge ${getStatusClass(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-gray-400 uppercase tracking-wide">
                          {t.customer_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`tac-badge ${getPriorityClass(t.priority)}`}>
                          {t.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#1a1a1d] border border-[#2a2a2e] flex items-center justify-center mr-2 rounded-sm">
                            <span className="text-[9px] text-[#E6B239] font-bold">
                              {t.agent_callsign ? t.agent_callsign.substring(0, 2) : 'UN'}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-gray-500">
                            {t.agent_callsign || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-[#1f1f23] flex items-center justify-between bg-[#0e0e10]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600">
              Showing {filteredTickets.length} of {tickets.length} records
            </div>
            <div className="flex items-center space-x-2">
              <button className="tac-btn tac-btn-ghost py-1.5 px-3 text-[10px]">Previous</button>
              <button className="tac-btn tac-btn-ghost py-1.5 px-3 text-[10px]">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}