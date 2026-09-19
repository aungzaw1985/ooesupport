import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminSla() {
  const [slas, setSlas] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [graceHours, setGraceHours] = useState(24);
  const [priority, setPriority] = useState('NORMAL');
  const [scheduleId, setScheduleId] = useState<number | ''>('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [slaRes, schedRes] = await Promise.all([
        api.get('/sla'),
        api.get('/schedule')
      ]);
      setSlas(slaRes.data);
      setSchedules(schedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sla', { 
        name, 
        graceHours, 
        priority, 
        scheduleId: scheduleId || undefined 
      });
      setName(''); 
      setGraceHours(24); 
      setPriority('NORMAL');
      setScheduleId('');
      fetchData();
    } catch (err) {
      console.error('Failed to create SLA');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create SLA Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Configure SLA Policy</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Policy Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                placeholder="e.g., Urgent Response Time" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Grace Period (Hours)</label>
                <input 
                  type="number" 
                  value={graceHours} 
                  onChange={(e) => setGraceHours(Number(e.target.value))} 
                  className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Priority</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)} 
                  className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Apply Schedule (Business Hours)</label>
              <select 
                value={scheduleId} 
                onChange={(e) => setScheduleId(e.target.value ? Number(e.target.value) : '')} 
                className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700"
              >
                <option value="">None (Count 24/7)</option>
                {schedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium"
            >
              Save Policy
            </button>
          </form>
        </div>

        {/* Active Policies List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Active Policies</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {slas.length === 0 && <p className="text-sm text-gray-500">No SLA policies configured yet.</p>}
            {slas.map((sla) => (
              <div key={sla.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-sm text-gray-700">{sla.name}</p>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {sla.gracePeriod}h
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <p>Priority: <span className="font-bold text-gray-600">{sla.priority}</span></p>
                  <p>Schedule: <span className="font-bold text-gray-600">{sla.schedule?.name || '24/7 (No Schedule)'}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}