import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [leaderId, setLeaderId] = useState<number | ''>('');
  const navigate = useNavigate();

  const fetchData = async () => {
    const [tRes, dRes, sRes] = await Promise.all([
      api.get('/teams'),
      api.get('/departments'),
      api.get('/staff')
    ]);
    setTeams(tRes.data);
    setDepartments(dRes.data);
    setStaff(sRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deptId) return;
    await api.post('/teams', { name, deptId: Number(deptId), leaderId: leaderId || undefined });
    setName(''); setDeptId(''); setLeaderId('');
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this team?')) {
      await api.delete(`/teams/${id}`);
      fetchData();
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Team Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create New Team</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Team Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Department</label>
              <select value={deptId} onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700" required>
                <option value="">Select Department...</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Team Leader (Optional)</label>
              <select value={leaderId} onChange={(e) => setLeaderId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="">None</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.firstname} {s.lastname}</option>)}
              </select>
            </div>
            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Create Team</button>
          </form>
        </div>

        {/* Existing Teams List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Teams</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {teams.length === 0 && <p className="text-sm text-gray-500">No teams created yet.</p>}
            {teams.map((team) => (
              <div key={team.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    <button onClick={() => navigate(`/admin/teams/${team.id}`)} className="text-blue-600 hover:underline">
                      {team.name}
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Dept: {team.department?.name || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Leader: {team.leader ? `${team.leader.firstname} ${team.leader.lastname}` : 'None'}</p>
                  <p className="text-xs text-gray-400 mt-1">Members: {team.members.length}</p>
                </div>
                <button onClick={() => handleDelete(team.id)} className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}