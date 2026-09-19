import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  
  // Editable state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgId, setOrgId] = useState<number | ''>('');
  const [role, setRole] = useState('USER');
  const [newPassword, setNewPassword] = useState('');

  const fetchUser = async () => {
    try {
      const res = await api.get(`/users/${id}`);
      setUser(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setPhone(res.data.phone || '');
      setOrgId(res.data.orgId || '');
      setRole(res.data.role);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const fetchOrgs = async () => {
    const res = await api.get('/organizations');
    setOrgs(res.data);
  };

  useEffect(() => {
    fetchUser();
    fetchOrgs();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${id}`, {
        name, email, phone,
        orgId: orgId || null,
        role,
        password: newPassword || undefined
      });
      setNewPassword('');
      alert('User details updated successfully!');
      fetchUser(); 
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await api.delete(`/users/${id}`);
        navigate('/admin/users');
      } catch (err) {
        console.error('Failed to delete user', err);
      }
    }
  };

  if (!user) return <div className="p-8 text-center text-gray-500">Loading user details...</div>;

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin/users')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Users List
      </button>

      {/* User Header */}
      <div className="clay p-6 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{user.email} | {user.phone || 'No phone number'}</p>
        </div>
        <button 
          onClick={handleDelete} 
          className="clay-button clay-sm text-red-600 px-4 py-2 text-sm font-medium w-full sm:w-auto"
        >
          Delete User
        </button>
      </div>

      {/* Edit Form */}
      <div className="clay p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-700">Edit User Information</h2>
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
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

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">Reset Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="Leave blank to keep current" />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="clay-button clay-sm text-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}