import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminTicketStatuses() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isClosed, setIsClosed] = useState(false);

  const fetchStatuses = async () => {
    const res = await api.get('/ticket-statuses');
    setStatuses(res.data);
  };

  useEffect(() => { fetchStatuses(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post('/ticket-statuses', { name, color, isClosed });
    setName(''); setColor('#3b82f6'); setIsClosed(false);
    fetchStatuses();
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    const status = statuses.find(s => s.id === id);
    if (status) {
      await api.patch(`/ticket-statuses/${id}`, { ...status, [field]: value });
      fetchStatuses();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this status? Existing tickets will keep the text but lose the color.')) {
      await api.delete(`/ticket-statuses/${id}`);
      fetchStatuses();
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create New Status</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Status Name</label>
              <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().replace(/\s/g, '_'))} className="w-full px-4 py-2 clay-input text-sm" placeholder="e.g., PENDING_VENDOR" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Badge Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 rounded cursor-pointer border-none" />
                <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 px-4 py-2 clay-input text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isClosed" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="isClosed" className="text-sm font-medium text-gray-700">Counts as "Closed" (Stops SLA Timer)</label>
            </div>
            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm">Add Status</button>
          </form>
        </div>

        {/* Existing Statuses List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Workflow Statuses</h2>
          <div className="space-y-3">
            {statuses.map(s => (
              <div key={s.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <input type="color" value={s.color} onChange={(e) => handleUpdate(s.id, 'color', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none" />
                  <div>
                    <p className="font-bold text-sm text-gray-700">{s.name.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{s.isClosed ? 'Closes Ticket' : 'Active'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={s.isClosed} onChange={(e) => handleUpdate(s.id, 'isClosed', e.target.checked)} /> Closed?
                  </label>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
