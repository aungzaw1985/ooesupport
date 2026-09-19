import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface Ticket {
  id: number;
  number: string;
  subject: string;
  status: string;
  priority: string;
  user: { name: string };
  dueDate?: string;
  firstResponseAt?: string;
  responseDueDate?: string;
  customData?: any;
  updatedAt: string;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const navigate = useNavigate();
  
  // Filter & Pagination states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats & UI states
  const [stats, setStats] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  // const [hasKbRole, setHasKbRole] = useState(false);
  const [view, setView] = useState('all'); // 'all', 'mine', 'unassigned'
  const [showColMenu, setShowColMenu] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [availableCols, setAvailableCols] = useState<string[]>([]);

  const [customFilterField, setCustomFilterField] = useState('');
  const [customFilterValue, setCustomFilterValue] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  // Dynamic Columns state (Load from localStorage or default to empty)
  const [visibleCustomCols, setVisibleCustomCols] = useState<string[]>(() => {
    const saved = localStorage.getItem('agentDashboardCols');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets', {
        params: { 
          search, 
          status, 
          priority, 
          page, 
          view: isAgent ? view : undefined,
          customFilterField: customFilterField || undefined,
          customFilterValue: customFilterValue || undefined
        }
      });
      setTickets(res.data.data);
      setTotalPages(res.data.meta.totalPages);
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

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  // 1. Decode Token & Fetch Initial Stats/Notifications/Statuses
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsAdmin(payload.isAdmin || false);
      const role = (payload.role || '').toUpperCase();
      setIsAgent(['AGENT', 'TEAM_LEADER', 'MANAGER'].includes(role));
    }
    fetchStats();
    fetchNotifications();
    api.get('/ticket-statuses').then(res => setStatuses(res.data));
    
    // Fetch forms available to the staff member to build column picker
    api.get('/forms/staff').then(res => {
      const cols = new Set<string>();
      res.data.forEach((form: any) => {
        form.fields.forEach((field: any) => {
          if (field.name !== 'subject') cols.add(field.name);
        });
      });
      setAvailableCols(Array.from(cols));
    });
  }, []);

  // 2. Refetch tickets whenever filters, view, or isAgent state changes
  useEffect(() => {
    fetchTickets();
  }, [search, status, priority, page, view, isAgent, customFilterField, customFilterValue]);

  // 3. Reset to page 1 if text filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, priority, view]);

  // 4. WebSocket listeners
  useEffect(() => {
    const socket: Socket = io();
    socket.on('ticket:created', (newTicket: Ticket) => {
      setTickets((prev) => [newTicket, ...prev]);
      fetchStats();
    });
    socket.on('ticket:updated', async (data: { id: number }) => {
      try {
        const res = await api.get(`/tickets/${data.id}`);
        setTickets((prev) => [res.data, ...prev.filter((t) => t.id !== data.id)]);
        fetchStats();
      } catch (err) { console.error(err); }
    });
    socket.on('notification:new', (newNotif: any) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleCustomCol = (col: string) => {
    setVisibleCustomCols(prev => {
      const newCols = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
      localStorage.setItem('agentDashboardCols', JSON.stringify(newCols));
      return newCols;
    });
  };

  const getSlaBadge = (ticket: Ticket) => {
    if (!ticket.dueDate) return null;

    // Find if this status counts as closed dynamically from the fetched statuses
    const statusConfig = statuses.find(s => s.name === ticket.status);
    const isClosed = statusConfig ? statusConfig.isClosed : false;

    const now = new Date();
    const endTime = isClosed ? new Date(ticket.updatedAt) : now;
    
    const dueDate = new Date(ticket.dueDate);
    const diff = dueDate.getTime() - endTime.getTime();

    // 1. Check Response SLA (Only if ticket hasn't been responded to yet)
    if (ticket.responseDueDate && !ticket.firstResponseAt && !isClosed) {
      const responseDue = new Date(ticket.responseDueDate);
      const responseDiff = responseDue.getTime() - now.getTime();
      
      if (responseDiff < 0) {
        const hoursOverdue = Math.abs(Math.round(responseDiff / (1000 * 60 * 60)));
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Resp. Overdue {hoursOverdue}h</span>;
      }
      const responseHoursLeft = Math.round(responseDiff / (1000 * 60 * 60));
      if (responseHoursLeft <= 1) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Resp. in {responseHoursLeft}h</span>;
    }

    // 2. Check Resolution SLA
    if (diff < 0) {
      const hoursOverdue = Math.abs(Math.round(diff / (1000 * 60 * 60)));
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Overdue {hoursOverdue}h</span>;
    } else {
      const hoursLeft = Math.round(diff / (1000 * 60 * 60));
      
      if (isClosed) {
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">SLA Met</span>;
      }
      
      if (hoursLeft <= 2) {
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{hoursLeft}h left</span>;
      }
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{hoursLeft}h left</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:h-screen md:overflow-hidden p-4 md:p-2">
      
      {/* FIXED TOP SECTION */}
      <div className="shrink-0 space-y-4 mb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-bold text-gray-700">Ticket Queue <span className="text-sm font-normal text-blue-500">(Live)</span></h1>
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-start sm:justify-end">
            {isAdmin && (
              <>
                <button onClick={() => navigate('/analytics')} className="clay-button clay-sm text-gray-700 px-4 py-2 text-sm w-full sm:w-auto">View Analytics</button>
                <button onClick={() => navigate('/admin')} className="clay-button clay-sm text-blue-600 px-4 py-2 text-sm w-full sm:w-auto">Admin Settings</button>
              </>
            )}
            <button onClick={() => navigate('/tickets/new')} className="clay-button clay-sm text-blue-600 font-medium px-4 py-2 text-sm w-full sm:w-auto">+ New Ticket</button>
            
            {/* Knowledge Base Button */}
              <button onClick={() => navigate('/admin/kb')} className="clay-button clay-sm text-purple-600 font-medium px-4 py-2 text-sm w-full sm:w-auto">
                Knowledge Base
              </button>
                        
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="clay-button clay-sm text-gray-700 p-2 rounded-full relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
              
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 border-b font-bold text-sm text-gray-700">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">No notifications yet.</p>}
                    {notifications.map(n => (
                      <a 
                        key={n.id} 
                        href={`/ticket/${n.ticketId}`} 
                        onClick={async (e) => { 
                          e.preventDefault(); 
                          await api.patch(`/notifications/${n.id}/read`);
                          setShowNotifMenu(false);
                          navigate(`/ticket/${n.ticketId}`);
                        }}
                        className={`block p-3 border-b hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                      >
                        <p className="text-sm text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/profile')} className="clay-button clay-sm text-gray-600 px-4 py-2 text-sm w-full sm:w-auto">My Profile</button>
            <button onClick={handleLogout} className="clay-button clay-sm text-red-500 px-4 py-2 text-sm w-full sm:w-auto">Logout</button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Total</p><p className="text-3xl font-bold text-gray-800">{stats.totalTickets}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Open</p><p className="text-3xl font-bold text-green-600">{stats.statusData.find((s: any) => s.name === 'OPEN')?.value || 0}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Resolved</p><p className="text-3xl font-bold text-yellow-600">{stats.statusData.find((s: any) => s.name === 'RESOLVED')?.value || 0}</p></div>
            <div className="clay p-4 flex flex-col items-center justify-center"><p className="text-xs font-medium text-gray-500 uppercase mb-2">Closed</p><p className="text-3xl font-bold text-gray-600">{stats.statusData.find((s: any) => s.name === 'CLOSED')?.value || 0}</p></div>
          </div>
        )}

        {isAgent && (
          <div className="flex gap-2 p-2 clay w-fit">
            <button onClick={() => setView('all')} className={`px-4 py-2 text-sm font-medium transition-all ${view === 'all' ? 'clay-active text-blue-600' : 'text-gray-500'}`}>All Available</button>
            <button onClick={() => setView('mine')} className={`px-4 py-2 text-sm font-medium transition-all ${view === 'mine' ? 'clay-active text-blue-600' : 'text-gray-500'}`}>Assigned to Me</button>
            <button onClick={() => setView('unassigned')} className={`px-4 py-2 text-sm font-medium transition-all ${view === 'unassigned' ? 'clay-active text-blue-600' : 'text-gray-500'}`}>Unassigned</button>
          </div>
        )}

        <div className="clay p-2 flex flex-col sm:flex-row gap-2 items-center relative">
          <input type="text" placeholder="Search by Ticket # or Subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm w-full focus:outline-none text-gray-700" />
          <div className="flex gap-4 w-full sm:w-auto">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 clay-input text-sm w-full focus:outline-none text-gray-700">
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s.id} value={s.name}>{s.name.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2 clay-input text-sm w-full focus:outline-none text-gray-700">
              <option value="">All Priorities</option><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
     
            {/* Custom Data Filter */}
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

            {/* Column Picker Button */}
            <button onClick={() => setShowColMenu(!showColMenu)} className="clay-button clay-sm px-4 py-2 text-sm text-gray-700 w-full sm:w-auto">
              Columns
            </button>
            
            {/* Column Picker Dropdown */}
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

      {/* SCROLLABLE BOTTOM SECTION */}
      <div className="flex-1 md:overflow-y-auto clay md:h-full mt-4 md:mt-0 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-[#e6ebf2] shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {/* Render Custom Column Headers */}
                {visibleCustomCols.map(col => (
                  <th key={col} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">SLA Timer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6 + visibleCustomCols.length} className="px-6 py-8 text-center text-sm text-gray-500">No tickets found matching your filters.</td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  // Check if ticket is unread
                  const lastRead = localStorage.getItem(`ticket_${ticket.id}_read`);
                  const unread = !lastRead || new Date(ticket.updatedAt).getTime() > new Date(lastRead).getTime();

                  // Find status config for custom colors
                  const statusConfig = statuses.find(s => s.name === ticket.status);
                  const badgeColor = statusConfig?.color || '#6b7280';

                  return (
                    <tr 
                      key={ticket.id} 
                      className={`cursor-pointer transition-colors ${
                        unread ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => navigate(`/ticket/${ticket.id}`)}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {ticket.number}
                          {unread && (
                            <span className="inline-block w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-3 whitespace-nowrap text-sm ${unread ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{ticket.user?.name}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{ticket.priority}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span 
                          className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${badgeColor}20`, // Appends '20' to hex for ~12% opacity background
                            color: badgeColor 
                          }}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {/* Render Custom Column Cells */}
                      {visibleCustomCols.map(col => (
                        <td key={col} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{ticket.customData?.[col] || '-'}</td>
                      ))}
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {getSlaBadge(ticket)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="sticky bottom-0 flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-[#e6ebf2]">
          <span className="text-sm text-gray-500">Page {page} of {totalPages || 1}</span>
          <div className="flex gap-4">
            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="clay-button clay-sm px-4 py-2 text-sm text-gray-600 disabled:opacity-50">Previous</button>
            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page >= totalPages} className="clay-button clay-sm px-4 py-2 text-sm text-gray-600 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}