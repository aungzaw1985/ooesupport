import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [leaderId, setLeaderId] = useState<number | ''>('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);
      setName(res.data.name);
      setDeptId(res.data.deptId || '');
      setLeaderId(res.data.leaderId || '');
    } catch (err) {
      console.error('Failed to fetch team', err);
    }
  };

  const fetchMetadata = async () => {
    const [deptRes, staffRes] = await Promise.all([
      api.get('/departments'),
      api.get('/staff')
    ]);
    setDepartments(deptRes.data);
    setStaff(staffRes.data);
  };

  useEffect(() => {
    fetchTeam();
    fetchMetadata();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/teams/${id}`, {
        name,
        deptId: deptId || null,
        leaderId: leaderId || null
      });
      alert('Team details updated successfully!');
      fetchTeam(); 
    } catch (err) {
      console.error('Failed to update team', err);
      alert('Failed to update team.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await api.delete(`/teams/${id}`);
        navigate('/admin/teams');
      } catch (err) {
        console.error('Failed to delete team', err);
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    try {
      await api.patch(`/staff/${selectedMemberId}`, { teamId: Number(id) });
      setSelectedMemberId('');
      fetchTeam(); 
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleRemoveMember = async (staffId: number) => {
    if (window.confirm('Remove this agent from the team?')) {
      try {
        await api.patch(`/staff/${staffId}`, { teamId: null });
        fetchTeam(); 
      } catch (err) {
        console.error('Failed to remove member', err);
      }
    }
  };

  if (!team) return <div className="p-8 text-center text-gray-500">Loading team details...</div>;

  const availableStaff = staff.filter((s) => !team.members.some((m: any) => m.id === s.id));

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/teams')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Teams List
      </button>

      {/* Team Header */}
      <div className="clay p-6 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">{team.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Department: {team.department?.name || 'Unassigned'}</p>
        </div>
        <button onClick={handleDelete} className="clay-button clay-sm text-red-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">
          Delete Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Edit Team Config */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-6 text-gray-700">Edit Team Configuration</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Team Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Department</label>
              <select value={deptId} onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="">Unassigned</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Team Leader</label>
              <select value={leaderId} onChange={(e) => setLeaderId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="">None</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.firstname} {s.lastname}</option>)}
              </select>
            </div>
            <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium">
              Save Changes
            </button>
          </form>
        </div>

        {/* Manage Members */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Team Members ({team.members.length})</h2>
          
          {availableStaff.length > 0 && (
            <form onSubmit={handleAddMember} className="space-y-3 mb-6 border-b pb-6">
              <label className="block text-sm font-medium mb-1 text-gray-600">Add Agent to Team</label>
              <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700" required>
                <option value="">Select an agent...</option>
                {availableStaff.map((s) => <option key={s.id} value={s.id}>{s.firstname} {s.lastname}</option>)}
              </select>
              <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Add Member</button>
            </form>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {team.members.length === 0 ? (
              <p className="text-sm text-gray-500">No members in this team yet.</p>
            ) : (
              team.members.map((member: any) => (
                <div key={member.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-700">
                      {member.firstname} {member.lastname}
                      {team.leaderId === member.id && <span className="ml-2 text-xs text-blue-600 font-bold">(Leader)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <button onClick={() => handleRemoveMember(member.id)} className="clay-button clay-sm text-red-600 px-3 py-1 text-xs font-medium">Remove</button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
