import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  id: number;
  number: string;
  subject: string;
  status: string;
  customData?: any;
}

export default function UserDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const navigate = useNavigate();

  const [customFilterField, setCustomFilterField] = useState('');
  const [customFilterValue, setCustomFilterValue] = useState('');

  // Custom Columns state
  const [availableCols, setAvailableCols] = useState<string[]>([]);
  const [visibleCustomCols, setVisibleCustomCols] = useState<string[]>(() => {
    const saved = localStorage.getItem('userDashboardCols');
    return saved ? JSON.parse(saved) : [];
  });
  const [showColMenu, setShowColMenu] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets', { 
        params: { 
          limit: 100,
          customFilterField: customFilterField || undefined,
          customFilterValue: customFilterValue || undefined
        } 
      });
      setTickets(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/tickets/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
    api.get('/ticket-statuses').then(res => setStatuses(res.data));
    
    // Fetch forms available to the user's organization to build column picker
    api.get('/forms/available').then(res => {
      const cols = new Set<string>();
      res.data.forEach((form: any) => {
        form.fields.forEach((field: any) => {
          if (field.name !== 'subject') cols.add(field.name);
        });
      });
      setAvailableCols(Array.from(cols));
    });
  }, [customFilterField, customFilterValue]);

  const toggleCustomCol = (col: string) => {
    setVisibleCustomCols(prev => {
      const newCols = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
      localStorage.setItem('userDashboardCols', JSON.stringify(newCols));
      return newCols;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:h-screen md:overflow-hidden p-4 md:p-2">
      
      {/* FIXED TOP SECTION */}
      <div className="shrink-0 space-y-4 mb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-bold text-gray-700">My Tickets <span className="text-sm font-normal text-green-500">(Live)</span></h1>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-start sm:justify-end">
            <button onClick={() => navigate('/portal/kb')} className="clay-button clay-sm text-gray-700 px-4 py-2 text-sm w-full sm:w-auto">
              Knowledge Base
            </button>
            <button onClick={() => navigate('/portal/tickets/new')} className="clay-button clay-sm text-blue-800 bg-green-600 px-4 py-2 text-sm w-full sm:w-auto">+ New Ticket</button>
            <button onClick={() => navigate('/portal/profile')} className="clay-button clay-sm text-gray-600 px-4 py-2 text-sm w-full sm:w-auto">My Profile</button>
            <button onClick={handleLogout} className="clay-button clay-sm text-red-500 px-4 py-2 text-sm w-full sm:w-auto">Logout</button>
            
            {/* Column Picker */}
            <div className="relative w-full sm:w-auto">
              <button onClick={() => setShowColMenu(!showColMenu)} className="clay-button clay-sm px-4 py-2 text-sm text-gray-700 w-full">
                Columns
              </button>
              {showColMenu && (
                <div className="absolute z-20 top-full right-0 mt-2 w-64 clay p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Custom Data Fields</p>
                  {availableCols.length === 0 && <p className="text-sm text-gray-500">No custom fields found in your forms.</p>}
                  {availableCols.map(col => (
                    <label key={col} className="flex items-center gap-2 text-sm text-gray-700 capitalize cursor-pointer">
                      <input type="checkbox" checked={visibleCustomCols.includes(col)} onChange={() => toggleCustomCol(col)} />
                      {col}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Total</p><p className="text-3xl font-bold text-gray-800">{stats.totalTickets}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Open</p><p className="text-3xl font-bold text-green-600">{stats.statusData.find((s: any) => s.name === 'OPEN')?.value || 0}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Resolved</p><p className="text-3xl font-bold text-yellow-600">{stats.statusData.find((s: any) => s.name === 'RESOLVED')?.value || 0}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Closed</p><p className="text-3xl font-bold text-gray-600">{stats.statusData.find((s: any) => s.name === 'CLOSED')?.value || 0}</p></div>
          </div>
        )}
      </div>
    
      {/* Custom Filter Bar */}
      <div className="clay p-2 flex flex-col sm:flex-row gap-2 items-center mb-4">
        <select 
          value={customFilterField} 
          onChange={(e) => { setCustomFilterField(e.target.value); setCustomFilterValue(''); }} 
          className="px-4 py-2 clay-input text-sm w-full focus:outline-none text-gray-700"
        >
          <option value="">No Custom Filter</option>
          {availableCols.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        
        {customFilterField && (
          <input 
            type="text" 
            placeholder={`Filter by ${customFilterField}...`} 
            value={customFilterValue} 
            onChange={(e) => setCustomFilterValue(e.target.value)} 
            className="px-4 py-2 clay-input text-sm w-full focus:outline-none text-gray-700"
          />
        )}
      </div>

      {/* SCROLLABLE BOTTOM SECTION */}
      <div className="flex-1 md:overflow-y-auto clay md:h-full mt-4 md:mt-0">
        <div className="overflow-x-auto h-full">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-[#e6ebf2] shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {/* Custom Columns */}
                {visibleCustomCols.map(col => (
                  <th key={col} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={3 + visibleCustomCols.length} className="px-6 py-8 text-center text-sm text-gray-500">You have not created any tickets yet.</td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const statusConfig = statuses.find(s => s.name === ticket.status);
                  const badgeColor = statusConfig?.color || '#6b7280';

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/portal/ticket/${ticket.id}`)}>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{ticket.number}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{ticket.subject}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${badgeColor}20`, 
                            color: badgeColor 
                          }}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {/* Custom Column Cells */}
                      {visibleCustomCols.map(col => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{ticket.customData?.[col] || '-'}</td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}