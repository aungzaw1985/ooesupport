import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: '', parentId: '', phone: '', website: '', address: '', city: '', state: '', zipCode: '', country: '' });
  const navigate = useNavigate();

  const fetchOrgs = async () => {
    const res = await api.get('/organizations');
    setOrgs(res.data);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await api.post('/organizations', form);
      setForm({ name: '', parentId: '', phone: '', website: '', address: '', city: '', state: '', zipCode: '', country: '' });
      fetchOrgs();
    } catch (err) {
      console.error('Failed to create organization');
    }
  };

  return (
    <div className="p-4 md:p-2 min-h-screen">
      <button onClick={() => navigate('/admin')} className="mb-4 text-blue-600 hover:underline text-sm">
        &larr; Back to Admin Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Create Organization Form */}
        <div className="clay p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Create Organization</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Organization Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Website</label>
                <input type="text" value={form.website} onChange={(e) => handleChange('website', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" placeholder="example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Street Address</label>
              <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">City</label>
                <input type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">State</label>
                <input type="text" value={form.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Zip</label>
                <input type="text" value={form.zipCode} onChange={(e) => handleChange('zipCode', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600">Country</label>
                <input type="text" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-4 py-2 clay-input text-sm focus:outline-none text-gray-700" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-600">Parent Organization (Optional)</label>
              <select value={form.parentId} onChange={(e) => handleChange('parentId', e.target.value)} className="w-full px-4 py-2 clay-input text-sm bg-white focus:outline-none text-gray-700">
                <option value="">None (Top-Level)</option>
                {orgs.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
              </select>
            </div>

            <button type="submit" className="clay-button clay-sm w-full text-blue-600 bg-blue-600 py-2 text-sm font-medium">
              Save Organization
            </button>
          </form>
        </div>

        {/* Existing Organizations List */}
        <div className="clay p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Existing Organizations</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {orgs.length === 0 && <p className="text-sm text-gray-500">No organizations configured yet.</p>}
            {orgs.map((org) => (
              <div key={org.id} className="p-4 rounded-xl bg-[#e6ebf2]">
                <div className="flex justify-between items-center">
                  <div>
                    <button onClick={() => navigate(`/admin/organizations/${org.id}`)} className="font-medium text-sm text-blue-600 hover:underline text-left">
                      {org.name}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">{org.parent ? `Sub of: ${org.parent.name}` : 'Top-Level Organization'}</p>
                    {org.phone && <p className="text-xs text-gray-400 mt-1">?? {org.phone}</p>}
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    {org._count.users} Users
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}