import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form state
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [role, setRole] = useState('AGENT');

  const fetchStaff = async () => {
    try {
      const [staffRes, deptRes, teamRes] = await Promise.all([
        api.get('/staff'),
        api.get('/departments'),
        api.get('/teams')
      ]);
      setStaffList(staffRes.data);
      setDepartments(deptRes.data);
      setTeams(teamRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const username = email.split('@')[0];

    try {
      await api.post('/staff', {
        firstname, lastname, email, username, phone,
        deptId: deptId || undefined,
        teamId: teamId || undefined,
        role,
        password: password || undefined
      });
      
      // Reset form
      setFirstname(''); setLastname(''); setEmail(''); setPhone(''); setPassword('');
      setDeptId(''); setTeamId(''); setRole('AGENT');
      fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create staff member.');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Staff Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Add New Agent</h2>
          {error && <p className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">First Name</label>
                <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Last Name</label>
                <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Contact Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="+1 555-0198" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="Leave blank for default 'password'" />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Create Agent</button>
          </form>
        </div>

        {/* Staff List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Agents ({staffList.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {staffList.length === 0 && <p className="text-sm text-gray-500">No agents created yet.</p>}
            {staffList.map((staff) => (
              <div key={staff.id} className="p-4 rounded-xl bg-[#e6ebf2] flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    <button onClick={() => navigate(`/admin/staff/${staff.id}`)} className="text-blue-600 hover:underline">
                      {staff.firstname} {staff.lastname}
                    </button>
                    {staff.role === 'ADMIN' || staff.role === 'MANAGER' || staff.role === 'TEAM_LEADER' ? (
                      <span className="ml-2 text-xs text-blue-600 font-bold">({staff.role.replace('_', ' ')})</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">{staff.email}</p>
                  <p className="text-xs text-gray-400">{staff.phone || 'No phone'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">{staff.department?.name || 'No Dept'}</p>
                  <p className="text-xs text-gray-400">{staff.memberTeam?.name || 'No Team'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}