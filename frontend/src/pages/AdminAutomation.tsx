import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminAutomation() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('TICKET_CREATED');
  
  // Condition state
  const [cField, setCField] = useState('subject');
  const [cOperator, setCOperator] = useState('contains');
  const [cValue, setCValue] = useState('');
  
  // Action state
  const [aType, setAType] = useState('SET_PRIORITY');
  const [aValue, setAValue] = useState('URGENT');
  const [actions, setActions] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);

  const fetchMetadata = async () => {
    const [deptRes, teamRes, staffRes] = await Promise.all([
      api.get('/departments'),
      api.get('/teams'),
      api.get('/staff')
    ]);
    setDepartments(deptRes.data);
    setTeams(teamRes.data);
    setStaff(staffRes.data);
  };

  const fetchRules = async () => {
    const res = await api.get('/automation');
    setRules(res.data);
  };

  useEffect(() => { 
    fetchMetadata(); 
    fetchRules(); 
  }, []);

  const addCondition = () => {
    setConditions([...conditions, { field: cField, operator: cOperator, value: cValue }]);
    setCValue(''); // Reset value after adding
  };

  const addAction = () => {
    setActions([...actions, { type: aType, value: aValue }]);
    // Don't reset aValue here so it's easy to add multiple similar actions
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || conditions.length === 0 || actions.length === 0) {
      alert('Please add a name, at least one condition, and one action.');
      return;
    }
    try {
      await api.post('/automation', { name, trigger, conditions, actions });
      setName(''); setConditions([]); setActions([]);
      fetchRules();
    } catch (err) {
      alert('Failed to create rule.');
    }
  };

  // Helper to format the display of conditions/actions in the list
  const formatValueDisplay = (type: string, value: string) => {
    if (type === 'SET_PRIORITY' || type === 'SET_STATUS' || type === 'priority' || type === 'status') return value;
    if (type === 'ASSIGN_TEAM' || type === 'teamId') return teams.find(t => t.id === Number(value))?.name || `ID: ${value}`;
    if (type === 'ASSIGN_AGENT' || type === 'staffId') return staff.find(s => s.id === Number(value)) ? `${staff.find(s => s.id === Number(value)).firstname} ${staff.find(s => s.id === Number(value)).lastname}` : `ID: ${value}`;
    if (type === 'ASSIGN_DEPT' || type === 'deptId') return departments.find(d => d.id === Number(value))?.name || `ID: ${value}`;
    return value;
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Rule Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create Automation Rule</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Rule Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="e.g., Escalate Server Outage" required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Trigger Event</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none">
                <option value="TICKET_CREATED">When Ticket is Created</option>
                <option value="TICKET_UPDATED">When Ticket is Updated</option>
              </select>
            </div>

            {/* Conditions Builder */}
            <div className="clay-sm p-4 bg-[#e6ebf2]">
              <h3 className="text-sm font-bold mb-3 text-gray-700">IF (Conditions)</h3>
              <div className="space-y-2 mb-3">
                {conditions.map((c, i) => (
                  <div key={i} className="text-xs text-gray-700 bg-white p-2 rounded flex justify-between items-center">
                    <span>{c.field} {c.operator} "{formatValueDisplay(c.field, c.value)}"</span>
                    <button type="button" onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">x</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <select value={cField} onChange={(e) => { setCField(e.target.value); setCValue(''); }} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="subject">Subject</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="deptId">Department</option>
                  </select>
                  <select value={cOperator} onChange={(e) => setCOperator(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {/* Dynamic Condition Value Input */}
                  {cField === 'subject' ? (
                    <input type="text" value={cValue} onChange={(e) => setCValue(e.target.value)} placeholder="Value..." className="flex-1 px-2 py-1 clay-input text-xs" />
                  ) : cField === 'status' ? (
                    <select value={cValue} onChange={(e) => setCValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                      <option value="">Select...</option>
                      <option value="OPEN">Open</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  ) : cField === 'priority' ? (
                    <select value={cValue} onChange={(e) => setCValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                      <option value="">Select...</option>
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : cField === 'deptId' ? (
                    <select value={cValue} onChange={(e) => setCValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                      <option value="">Select...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : null}
                  
                  <button type="button" onClick={addCondition} className="clay-button clay-sm text-green-700 bg-blue-600 px-3 py-1 text-xs">Add</button>
                </div>
              </div>
            </div>

            {/* Actions Builder */}
            <div className="clay-sm p-4 bg-[#e6ebf2]">
              <h3 className="text-sm font-bold mb-3 text-gray-700">THEN (Actions)</h3>
              <div className="space-y-2 mb-3">
                {actions.map((a, i) => (
                  <div key={i} className="text-xs text-gray-700 bg-white p-2 rounded flex justify-between items-center">
                    <span>{a.type.replace(/_/g, ' ')} &gt; {formatValueDisplay(a.type, a.value)}</span>
                    <button type="button" onClick={() => setActions(actions.filter((_, idx) => idx !== i))} className="text-red-500 font-bold">x</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <select value={aType} onChange={(e) => { setAType(e.target.value); setAValue(''); }} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                  <option value="SET_PRIORITY">Set Priority</option>
                  <option value="SET_STATUS">Set Status</option>
                  <option value="ASSIGN_TEAM">Assign Team</option>
                  <option value="ASSIGN_AGENT">Assign Agent</option>
                  <option value="ASSIGN_DEPT">Assign Department</option>
                </select>
                
                {/* Dynamic Action Value Input */}
                {aType === 'SET_PRIORITY' ? (
                  <select value={aValue} onChange={(e) => setAValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                ) : aType === 'SET_STATUS' ? (
                  <select value={aValue} onChange={(e) => setAValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="OPEN">Open</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                ) : aType === 'ASSIGN_TEAM' ? (
                  <select value={aValue} onChange={(e) => setAValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="">Select Team...</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : aType === 'ASSIGN_AGENT' ? (
                  <select value={aValue} onChange={(e) => setAValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="">Select Agent...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.firstname} {s.lastname}</option>)}
                  </select>
                ) : aType === 'ASSIGN_DEPT' ? (
                  <select value={aValue} onChange={(e) => setAValue(e.target.value)} className="flex-1 px-2 py-1 clay-input text-xs bg-white">
                    <option value="">Select Dept...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : null}

                <button type="button" onClick={addAction} className="clay-button clay-sm text-green-700 bg-blue-600 px-3 py-1 text-xs">Add Action</button>
              </div>
            </div>

            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Save Rule</button>
          </form>
        </div>

        {/* Existing Rules List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Active Rules</h2>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm text-gray-700">{rule.name}</h3>
                  <button onClick={() => { if(window.confirm('Delete rule?')) { api.delete(`/automation/${rule.id}`).then(fetchRules); }}} className="text-red-600 text-xs">Delete</button>
                </div>
                <p className="text-xs text-gray-500">Trigger: {rule.trigger.replace(/_/g, ' ')}</p>
                <div className="text-xs text-gray-600 mt-2">Conditions:</div>
                <ul className="text-xs text-gray-500 bg-white p-2 rounded mt-1 space-y-1">
                  {rule.conditions.map((c: any, i: number) => (
                    <li key={i}>- {c.field} {c.operator} "{formatValueDisplay(c.field, c.value)}"</li>
                  ))}
                </ul>
                <div className="text-xs text-gray-600 mt-2">Actions:</div>
                <ul className="text-xs text-gray-500 bg-white p-2 rounded mt-1 space-y-1">
                  {rule.actions.map((a: any, i: number) => (
                    <li key={i}>- {a.type.replace(/_/g, ' ')} &gt; {formatValueDisplay(a.type, a.value)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}