import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Sliders, Clock, Building2, Users, ChevronRight } from 'lucide-react';

export default function AdminPortal({ token }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(tab || 'forms');
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({});
  
  const [forms, setForms] = useState([]);
  const [slaPlans, setSlaPlans] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchData = async () => {
    try {
      const [formsRes, slaRes, depRes, staffRes, rolesRes] = await Promise.all([
        fetch('/api/admin/forms', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/sla', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/departments', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/staff', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/roles', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
      ]);
      setForms(formsRes);
      setSlaPlans(slaRes);
      setDepartments(depRes);
      setStaff(staffRes);
      setRoles(rolesRes);
    } catch (err) {
      console.error("Admin fetch error", err);
    }
  };

  useEffect(() => {
    if (tab) setActiveTab(tab);
    fetchData();
  }, [tab, token]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/admin/${newTab}`);
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    let endpoint = '';
    let payload = {};

    if (activeTab === 'forms') {
      endpoint = '/api/admin/forms';
      payload = { name: newItem.name, fields: [] };
    } else if (activeTab === 'sla') {
      endpoint = '/api/admin/sla';
      payload = { name: newItem.name, response_time_mins: parseInt(newItem.response || 15), resolution_time_mins: parseInt(newItem.resolution || 60) };
    } else if (activeTab === 'departments') {
      endpoint = '/api/admin/departments';
      payload = { name: newItem.name };
    } else if (activeTab === 'staff') {
      endpoint = '/api/admin/staff';
      payload = newItem;
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      setNewItem({});
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Creation failed', err);
    }
  };

  const subNav = [
    { key: 'forms', label: 'Help Topics', icon: Sliders },
    { key: 'sla', label: 'SLA Plans', icon: Clock },
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'staff', label: 'Staff & Roles', icon: Users },
  ];

  return (
    <div className="min-h-full">
      {/* Secondary Sub Navigation - Full Width */}
      <div className="bg-[#0e0e10] border-b border-[#1f1f23] sticky top-16 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 overflow-x-auto tac-scroll">
            {subNav.map(item => (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`flex items-center py-4 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === item.key ? 'text-white border-[#E6B239]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
              >
                <item.icon className="w-3.5 h-3.5 mr-2" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3 mx-1" />
                <span>Manage</span>
                <ChevronRight className="w-3 h-3 mx-1" />
                <span className="text-[#E6B239]">{subNav.find(s => s.key === activeTab)?.label}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{subNav.find(s => s.key === activeTab)?.label}</h1>
            </div>
            <button onClick={() => setShowForm(!showForm)} className={`tac-btn ${showForm ? 'tac-btn-ghost' : 'tac-btn-crimson'}`}>
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              Add New {activeTab === 'sla' ? 'Plan' : activeTab === 'forms' ? 'Help Topic' : activeTab === 'staff' ? 'Staff' : activeTab.slice(0, -1)}
            </button>
          </div>

          {/* Inline Creation Form */}
          {showForm && (
            <form onSubmit={handleCreate} className="tac-panel p-6 mb-8 border-l-2 border-l-[#E6B239] rounded-sm">
              <h3 className="font-mono text-xs uppercase tracking-widest text-[#E6B239] mb-6">Configure New Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTab === 'forms' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Topic / Form Name</label>
                    <input type="text" placeholder="e.g., Cyber Intrusion Report" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="tac-input" required />
                  </div>
                )}
                
                {activeTab === 'sla' && (
                  <>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Plan Name</label>
                      <input type="text" placeholder="e.g., Priority Alpha" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="tac-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Response Time (Mins)</label>
                      <input type="number" placeholder="15" value={newItem.response || ''} onChange={e => setNewItem({...newItem, response: e.target.value})} className="tac-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Resolution Time (Mins)</label>
                      <input type="number" placeholder="60" value={newItem.resolution || ''} onChange={e => setNewItem({...newItem, resolution: e.target.value})} className="tac-input" required />
                    </div>
                  </>
                )}

                {activeTab === 'departments' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Department Name</label>
                    <input type="text" placeholder="e.g., Cyber Defense" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} className="tac-input" required />
                  </div>
                )}

                {activeTab === 'staff' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Callsign</label>
                      <input type="text" placeholder="GHOST-02" value={newItem.callsign || ''} onChange={e => setNewItem({...newItem, callsign: e.target.value})} className="tac-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Email</label>
                      <input type="email" placeholder="operator@tacops.io" value={newItem.email || ''} onChange={e => setNewItem({...newItem, email: e.target.value})} className="tac-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Access Code</label>
                      <input type="password" placeholder="******" value={newItem.password || ''} onChange={e => setNewItem({...newItem, password: e.target.value})} className="tac-input" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2">Role Assignment</label>
                      <select value={newItem.role_id || ''} onChange={e => setNewItem({...newItem, role_id: e.target.value})} className="tac-input" required>
                        <option value="">Select Role...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="tac-btn tac-btn-crimson">Deploy Configuration</button>
              </div>
            </form>
          )}

          {/* List Views - Dense Data Table */}
          <div className="tac-panel rounded-sm overflow-hidden">
            <div className="overflow-x-auto tac-scroll">
              <table className="w-full">
                <thead>
                  <tr>
                    {activeTab === 'forms' && (
                      <>
                        <th className="tac-table-header">Form Name</th>
                        <th className="tac-table-header w-32">Fields</th>
                        <th className="tac-table-header w-32">Status</th>
                        <th className="tac-table-header w-40">Created</th>
                      </>
                    )}
                    {activeTab === 'sla' && (
                      <>
                        <th className="tac-table-header">Plan Name</th>
                        <th className="tac-table-header w-40">Response Time</th>
                        <th className="tac-table-header w-40">Resolution Time</th>
                        <th className="tac-table-header w-40">Created</th>
                      </>
                    )}
                    {activeTab === 'departments' && (
                      <>
                        <th className="tac-table-header">Department Name</th>
                        <th className="tac-table-header w-40">Created</th>
                      </>
                    )}
                    {activeTab === 'staff' && (
                      <>
                        <th className="tac-table-header">Callsign</th>
                        <th className="tac-table-header">Email</th>
                        <th className="tac-table-header w-40">Role</th>
                        <th className="tac-table-header w-32">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* Forms Data */}
                  {activeTab === 'forms' && forms.map(item => (
                    <tr key={item.id} className="border-b border-[#161618] hover:bg-[#161618] cursor-pointer transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">0 Configured</td>
                      <td className="px-6 py-4">
                        <span className={`tac-badge ${item.is_active ? 'border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10' : 'border-gray-600 text-gray-600 bg-gray-600/10'}`}>
                          {item.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}

                  {/* SLA Data */}
                  {activeTab === 'sla' && slaPlans.map(item => (
                    <tr key={item.id} className="border-b border-[#161618] hover:bg-[#161618] cursor-pointer transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.response_time_mins} Mins</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.resolution_time_mins} Mins</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}

                  {/* Departments Data */}
                  {activeTab === 'departments' && departments.map(item => (
                    <tr key={item.id} className="border-b border-[#161618] hover:bg-[#161618] cursor-pointer transition-colors">
                      <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}

                  {/* Staff Data */}
                  {activeTab === 'staff' && staff.map(item => (
                    <tr key={item.id} className="border-b border-[#161618] hover:bg-[#161618] cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#1a1a1d] border border-[#2a2a2e] flex items-center justify-center mr-3 rounded-sm">
                            <span className="text-[10px] text-[#E6B239] font-bold">{item.callsign?.substring(0, 2)}</span>
                          </div>
                          <div className="text-sm text-white font-medium">{item.callsign}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">{item.email}</td>
                      <td className="px-6 py-4">
                        <span className="tac-badge border-[#E6B239] text-[#E6B239] bg-[#E6B239]/10">
                          {item.role_name || 'UNASSIGNED'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`tac-badge ${item.is_active ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-[#FF1F28] text-[#FF1F28] bg-[#FF1F28]/10'}`}>
                          {item.is_active ? 'Online' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-[#1f1f23] flex items-center justify-between bg-[#0e0e10]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-600">
                Total Records: {activeTab === 'forms' ? forms.length : activeTab === 'sla' ? slaPlans.length : activeTab === 'departments' ? departments.length : staff.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}