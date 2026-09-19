import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [role, setRole] = useState('AGENT');
  const [kbRole, setKbRole] = useState('NONE');
  const [newPassword, setNewPassword] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.get(`/staff/${id}`);
      setStaff(res.data);
      setFirstname(res.data.firstname);
      setLastname(res.data.lastname);
      setEmail(res.data.email);
      setPhone(res.data.phone || '');
      setDeptId(res.data.deptId || '');
      setTeamId(res.data.teamId || '');
      setRole(res.data.role);
      setKbRole(res.data.kbRole || 'NONE');
    } catch (err) { console.error('Failed to fetch staff', err); }
  };

  const fetchMetadata = async () => {
    const [deptRes, teamRes] = await Promise.all([api.get('/departments'), api.get('/teams')]);
    setDepartments(deptRes.data);
    setTeams(teamRes.data);
  };

  useEffect(() => { fetchStaff(); fetchMetadata(); }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/staff/${id}`, {
        firstname, lastname, email, phone,
        deptId: deptId || null,
        teamId: teamId || null,
        role,
        kbRole,
        password: newPassword || undefined
      });
      setNewPassword('');
      alert('Staff details updated successfully!');
      fetchStaff(); 
    } catch (err) {
      console.error('Failed to update staff', err);
      alert('Failed to update staff.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this staff member? This cannot be undone.')) {
      try {
        await api.delete(`/staff/${id}`);
        navigate('/admin/staff');
      } catch (err) { console.error('Failed to delete staff', err); }
    }
  };

  if (!staff) return <div className="p-8 text-center text-gray-500">Loading staff details...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/staff')} className="mb-4 text-blue-600 hover:underline text-sm">&larr; Back to Staff List</button>

      <div className="clay p-6 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">{staff.firstname} {staff.lastname}</h1>
          <p className="text-sm text-gray-500 mt-1">{staff.email} | {staff.phone || 'No phone number'}</p>
        </div>
        <button onClick={handleDelete} className="clay-button clay-sm text-red-600 px-4 py-2 text-sm font-medium w-full sm:w-auto">Delete Agent</button>
      </div>

      <div className="clay p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-700">Edit Agent Information</h2>
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">First Name</label>
            <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Last Name</label>
            <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Contact Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="+1 555-0198" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Department</label>
            <select value={deptId} onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
              <option value="">Unassigned</option>
              {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
              <option value="">Unassigned</option>
              {teams.map((team) => (<option key={team.id} value={team.id}>{team.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
              <option value="AGENT">Agent</option>
              <option value="TEAM_LEADER">Team Leader</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Knowledge Base Role</label>
            <select value={kbRole} onChange={(e) => setKbRole(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
              <option value="NONE">None</option>
              <option value="KB_CREATOR">KB Creator</option>
              <option value="KB_REVIEWER">KB Reviewer</option>
              <option value="KB_APPROVER">KB Approver</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Reset Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="Leave blank to keep current" />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="clay-button clay-sm text-blue-800 bg-blue-600 px-6 py-2 text-sm font-medium">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}