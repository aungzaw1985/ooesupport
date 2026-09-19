import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Terminal, LogOut, Menu, X, LayoutDashboard, Ticket as TicketIcon, Users, Settings, LifeBuoy } from 'lucide-react';
import AgentDashboard from './components/AgentDashboard.jsx';
import TicketDetail from './components/TicketDetail.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import CustomerPortal from './components/CustomerPortal.jsx';

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('tac_token');
    const identity = localStorage.getItem('tac_identity');
    const type = localStorage.getItem('tac_type');
    return token ? { token, identity, type } : null;
  });
  const navigate = useNavigate();

  const login = (token, identity, type) => {
    localStorage.setItem('tac_token', token);
    localStorage.setItem('tac_identity', identity);
    localStorage.setItem('tac_type', type);
    setAuth({ token, identity, type });
    navigate(type === 'STAFF' ? '/dashboard' : '/portal');
  };

  const logout = () => {
    localStorage.removeItem('tac_token');
    localStorage.removeItem('tac_identity');
    localStorage.removeItem('tac_type');
    setAuth(null);
    navigate('/');
  };

  if (!auth) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="h-screen flex flex-col bg-transparent">
      <TopNav auth={auth} logout={logout} />
      <main className="flex-1 overflow-y-auto tac-scroll">
        <Routes>
          <Route path="/" element={<Navigate to={auth.type === 'STAFF' ? "/dashboard" : "/portal"} replace />} />
          
          {auth.type === 'STAFF' && (
            <>
              <Route path="/dashboard" element={<AgentDashboard token={auth.token} />} />
              <Route path="/tickets" element={<AgentDashboard token={auth.token} />} />
              <Route path="/ticket/:id" element={<TicketDetail token={auth.token} callsign={auth.identity} />} />
              <Route path="/admin" element={<AdminPortal token={auth.token} />} />
              <Route path="/admin/:tab" element={<AdminPortal token={auth.token} />} />
            </>
          )}
          
          {auth.type === 'CUSTOMER' && (
            <>
              <Route path="/portal" element={<CustomerPortal token={auth.token} />} />
              <Route path="/ticket/:id" element={<TicketDetail token={auth.token} callsign={auth.identity} />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function TopNav({ auth, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const links = auth.type === 'STAFF' ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: TicketIcon },
    { to: '/admin/staff', label: 'Staff & Roles', icon: Users },
    { to: '/admin/forms', label: 'Admin Engine', icon: Settings },
  ] : [
    { to: '/portal', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <nav className="bg-[#0e0e10] border-b border-[#1f1f23] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#8A0505] flex items-center justify-center rounded-sm">
                <Terminal className="w-4 h-4 text-[#E6B239]" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-mono font-bold text-white tracking-[0.15em] text-sm leading-none">TAC-OS</span>
                <span className="font-mono text-[8px] text-gray-600 tracking-widest mt-1">CMD NODE</span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-2">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link ${isActive(link.to) ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  <link.icon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User Profile & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-[#0A0A0B] border border-[#1f1f23] px-3 py-1.5 rounded-sm">
              <div className={`w-2 h-2 rounded-full ${auth.type === 'STAFF' ? 'bg-[#E6B239]' : 'bg-blue-400'}`}></div>
              <span className="text-xs text-gray-400 font-mono uppercase">{auth.type === 'STAFF' ? 'Operator' : 'Civilian'}</span>
              <span className="text-sm text-white font-mono font-bold tracking-wide">{auth.identity}</span>
            </div>
            <button onClick={logout} className="hidden sm:flex tac-btn tac-btn-ghost">
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
            
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="md:hidden text-gray-400 hover:text-white p-2"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center w-full px-4 py-3 text-sm font-mono uppercase tracking-widest rounded-sm ${isActive(link.to) ? 'bg-[#1a1a1d] text-white' : 'text-gray-400 hover:bg-[#161618]'}`}
              >
                <link.icon className="w-4 h-4 mr-3" />
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-4 pt-4 mt-4 border-t border-[#1f1f23]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${auth.type === 'STAFF' ? 'bg-[#E6B239]' : 'bg-blue-400'}`}></div>
                <span className="text-sm text-white font-mono font-bold">{auth.identity}</span>
              </div>
              <button onClick={logout} className="tac-btn tac-btn-ghost">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('STAFF');
  const [email, setEmail] = useState('admin@tacops.io');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'STAFF') {
      setEmail('admin@tacops.io');
      setPassword('admin123');
    } else {
      setEmail('customer@tacops.io');
      setPassword('customer123');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'STAFF' ? '/api/auth/staff/login' : '/api/auth/customer/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      if (mode === 'STAFF') onLogin(data.token, data.operator.callsign, 'STAFF');
      else onLogin(data.token, data.customer.name, 'CUSTOMER');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0B]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8A0505]/10 rounded-full blur-[120px]"></div>
      
      <div className="relative w-[420px] tac-panel p-8">
        <div className="mb-8 text-center">
          <div className="inline-block p-4 border border-[#8A0505] bg-[#8A0505]/10 rounded-sm mb-5">
            <ShieldAlert className="w-8 h-8 text-[#FF1F28]" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-[0.2em] text-white">TAC-OS</h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mt-2">Tactical Command Node</p>
        </div>
        
        <div className="flex mb-8 bg-[#0A0A0B] border border-[#1f1f23] p-1 rounded-sm">
          <button onClick={() => switchMode('STAFF')} className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all rounded-sm ${mode === 'STAFF' ? 'bg-[#8A0505] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Operator Access
          </button>
          <button onClick={() => switchMode('CUSTOMER')} className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all rounded-sm ${mode === 'CUSTOMER' ? 'bg-[#8A0505] text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Civilian Access
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-2">Identifier</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="tac-input" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-2">Access Code</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="tac-input" />
          </div>
          {error && <div className="text-[#FF1F28] text-xs font-mono bg-[#FF1F28]/10 border border-[#FF1F28]/30 px-3 py-2 text-center rounded-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full tac-btn tac-btn-crimson mt-4">
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}