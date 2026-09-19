import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgId, setOrgId] = useState<number | ''>('');
  const [role, setRole] = useState('USER');
  const [password, setPassword] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        api.get('/users'),
        api.get('/organizations')
      ]);
      setUsers(usersRes.data);
      setOrgs(orgsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        name, email, phone,
        orgId: orgId || undefined,
        role,
        password: password || undefined
      });
      setName(''); setEmail(''); setPhone(''); setPassword('');
      setOrgId(''); setRole('USER');
      fetchData();
    } catch (err) {
      console.error('Failed to create user');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create User Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create New User</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
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
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Organization</label>
              <select value={orgId} onChange={(e) => setOrgId(e.target.value ? Number(e.target.value) : '')} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="">None (Unassigned)</option>
                {orgs.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="USER">Standard User</option>
                <option value="MANAGER">Manager (Can see Org tickets)</option>
              </select>
            </div>
            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">Create User</button>
          </form>
        </div>

        {/* Users List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Users</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {users.length === 0 && <p className="text-sm text-gray-500">No users created yet.</p>}
            {users.map((user) => (
              <div key={user.id} className="p-4 rounded-xl bg-[#e6ebf2] flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    <button onClick={() => navigate(`/admin/users/${user.id}`)} className="text-blue-600 hover:underline">
                      {user.name}
                    </button>
                    {user.role === 'MANAGER' && <span className="ml-2 text-xs text-blue-600 font-bold">(Manager)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.phone || 'No phone'}</p>
                </div>
                <span className="text-xs text-gray-500 font-medium text-right">{user.organization?.name || 'No Org'}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}